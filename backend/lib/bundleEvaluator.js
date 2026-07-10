/**
 * lib/bundleEvaluator.js
 *
 * Takes the structured output from parseSearchResults (flights + hotels arrays)
 * and the user preferences, then asks Groq to:
 *   1. Cross-join every flight × hotel combination.
 *   2. Calculate totalCost = (flight.price × travelers × legs) + (hotel.pricePerNight × nights).
 *   3. Filter out bundles that exceed the budget.
 *   4. Rank surviving bundles cheapest → most expensive.
 *   5. Return a raw JSON array of at most 3 bundles.
 */

/**
 * Calculate the number of nights between two YYYY-MM-DD strings.
 * @param {string} checkIn
 * @param {string} checkOut
 * @returns {number}
 */
function calcNights(checkIn, checkOut) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const inMs = new Date(checkIn).getTime();
  const outMs = new Date(checkOut).getTime();
  if (Number.isNaN(inMs) || Number.isNaN(outMs) || outMs <= inMs) return 1;
  return Math.round((outMs - inMs) / msPerDay);
}

/**
 * Pre-compute all flight × hotel combinations with cost figures so that
 * Groq has precise numbers to reason over (avoids hallucinated arithmetic).
 * @param {object[]} flights
 * @param {object[]} hotels
 * @param {object}   preferences
 * @returns {{ bundles: object[], nights: number }}
 */
function flightLegMultiplier(preferences) {
  return preferences?.tripType === "oneWay" ? 1 : 2;
}

function buildCandidateBundles(flights, hotels, preferences) {
  const travelers = Number(preferences.travelers) || 1;
  const budget = Number(preferences.budget) || Infinity;
  const nights = calcNights(preferences.checkIn, preferences.checkOut);
  const flightLegs = flightLegMultiplier(preferences);

  const bundles = [];

  for (const flight of flights) {
    const flightCost = (Number(flight.price) || 0) * travelers * flightLegs;
    for (const hotel of hotels) {
      const hotelCost = (Number(hotel.pricePerNight) || 0) * nights;
      const totalCost = flightCost + hotelCost;
      const budgetRemaining = budget - totalCost;

      bundles.push({
        flight,
        hotel,
        calculatedFlightCost: flightCost,
        calculatedHotelCost: hotelCost,
        calculatedTotalCost: totalCost,
        calculatedBudgetRemaining: budgetRemaining,
        fitsInBudget: totalCost <= budget,
      });
    }
  }

  return { bundles, nights };
}

/**
 * Sends pre-computed bundle candidates to Groq and returns at most 3 ranked bundles.
 *
 * @param {object}   parsedData            Output from parseSearchResults()
 * @param {object[]} parsedData.flights
 * @param {object[]} parsedData.hotels
 * @param {object}   preferences
 * @param {string}   preferences.origin
 * @param {string}   preferences.destination
 * @param {string}   preferences.checkIn      YYYY-MM-DD
 * @param {string}   preferences.checkOut     YYYY-MM-DD
 * @param {number}   preferences.travelers
 * @param {number}   preferences.budget       Total trip budget in INR
 * @param {string}   preferences.airlines     IATA code or "any"
 * @param {boolean}  preferences.directOnly
 * @param {string}   preferences.departureTime "morning"|"afternoon"|"evening"|"any"
 * @param {number}   preferences.minRating    0-5
 * @param {string[]} preferences.amenities
 * @param {object} [parsedAiPreferences]
 * @returns {Promise<object[]>}
 */
async function evaluateBundles(parsedData, preferences, parsedAiPreferences = {}) {
  const flights = Array.isArray(parsedData?.flights) ? parsedData.flights : [];
  const hotels = Array.isArray(parsedData?.hotels) ? parsedData.hotels : [];

  if (flights.length === 0 || hotels.length === 0) return [];

  const { bundles, nights } = buildCandidateBundles(flights, hotels, preferences);

  // Only keep budget-fitting candidates.
  const affordableBundles = bundles.filter((b) => b.fitsInBudget);
  if (affordableBundles.length === 0) return [];

  // When using mock data, skip Groq entirely — rank deterministically while
  // preserving variety so the UI has enough options for filters and comparisons.
  if (process.env.USE_MOCK === "true") {
    return rankDiverseBundles(affordableBundles, nights, preferences, parsedAiPreferences, 12);
  }

  const { groq } = require("./groq");
  const prompt = buildPrompt(affordableBundles, nights, preferences, parsedAiPreferences);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a travel bundle evaluator. You receive pre-computed flight+hotel bundle candidates " +
          "with exact cost figures already calculated. Your ONLY job is to evaluate preference match, " +
          "assign verdicts, rank the bundles, diversify hotel choices, and return up to 12 as a raw JSON array. " +
          "Output ONLY the raw JSON array — no markdown, no code fences, no explanations, nothing else.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
    max_tokens: 3000,
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  return normalizeReturnedBundles(parseGroqResponse(raw), 12);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPrompt(affordableBundles, nights, preferences, parsedAiPreferences) {
  const prefs = preferences || {};
  const budget = Number(prefs.budget) || 0;
  const aiPrefs = parsedAiPreferences || {};

  const compactBundles = affordableBundles.map((b, idx) => ({
    index: idx,
    flight: {
      airline: b.flight.airline,
      price: b.flight.price,
      departureTime: b.flight.departureTime,
      stops: b.flight.stops
    },
    hotel: {
      name: b.hotel.name || b.hotel.hotelName,
      rating: b.hotel.rating,
      pricePerNight: b.hotel.pricePerNight,
      amenities: b.hotel.amenities
    },
    totalCost: b.calculatedTotalCost,
    budgetRemaining: b.calculatedBudgetRemaining
  }));

  return `You are given a list of pre-computed flight+hotel bundle candidates that all fit within the user's budget.
Your task:
1. Evaluate each bundle against:
   - The user's explicit filter preferences (directOnly, airlines, departureTime, minRating, amenities).
   - The AI-extracted trip preferences: travellerType, elderlyTravellers, hotelPreferences, flightPreferences.
2. Determine preferenceMatch ("full" or "partial") and preferencesMissed:
   - Explicit filters are STRICT: if an explicit filter is missed, list it in preferencesMissed and make preferenceMatch "partial". Do NOT let AI preferences overwrite or ignore explicit filters.
   - AI-extracted preferences are enhancement preferences. If an AI preference is not met, do NOT list it as a missed explicit preference but use it to lower the ranking score of the bundle.
3. Assign a verdict:
   - "good_deal"  if totalCost < ${Math.round(budget * 0.8)} (less than 80% of budget)
   - "tight"      if totalCost is between ${Math.round(budget * 0.8)} and ${budget} (80–100% of budget)
4. Rank bundles primarily by preference matching (prioritizing candidates that satisfy both explicit filters and match the AI-extracted preferences), and secondarily by cost (cheapest → most expensive).
5. Return up to 12 bundles as a raw JSON array so the frontend filters have enough inventory to work with. If there are fewer than 12, return all of them.
6. Diversify the recommendations: avoid returning the same hotel repeatedly when comparable hotel alternatives are available. Prefer a mix of hotels first, then a mix of airlines/flights.
7. If no bundles remain after evaluation, return an empty JSON array: []

Preference rules to check for preferenceMatch / preferencesMissed (EXPLICIT FILTER RULES):
- directOnly: ${prefs.directOnly === true ? `"true" — a preference IS missed if stops > 0` : `"false" — no stops requirement`}
- airlines: ${prefs.airlines && prefs.airlines !== "any" ? `"${prefs.airlines}" — a preference IS missed if flight airline does not match` : `"any" — no airline preference to miss`}
- departureTime: ${prefs.departureTime && prefs.departureTime !== "any" ? `"${prefs.departureTime}" — morning=05:00-11:59, afternoon=12:00-16:59, evening=17:00-23:59; a preference IS missed if departureTime does not fall in the requested window` : `"any" — no departure time preference to miss`}
- minRating: ${typeof prefs.minRating === "number" ? `${prefs.minRating} — a preference IS missed if hotel rating < ${prefs.minRating}` : `no minimum rating`}
- amenities: ${Array.isArray(prefs.amenities) && prefs.amenities.length > 0 ? `[${prefs.amenities.map((a) => `"${a}"`).join(", ")}] — a preference IS missed for each amenity NOT present in the hotel's amenities list` : `[] — no amenity preferences to miss`}

AI-EXTRACTED TRIP PREFERENCES (Use to rank/score bundles):
${JSON.stringify(aiPrefs, null, 2)}

Ensure you prioritize hotels and flights matching the AI-extracted preferences. For example, if the user asks for a pet-friendly hotel, prefer hotels whose amenities or descriptive data indicate pet-friendly/pets allowed; include that in aiPreferenceMatches or list it in recommendationReasons. If travellerType is family or elderlyTravellers is true, prefer hotels with child-friendly or accessible features/reviews, quiet locations, and flights with layover/time characteristics that avoid what the user dislikes.

Output schema for EACH bundle object (use these EXACT field names):
{
  "index": number,
  "preferenceMatch": "full" | "partial",
  "preferencesMissed": string[],
  "aiPreferenceMatches": string[],
  "recommendationReasons": string[],
  "verdict": "good_deal" | "tight"
}

CANDIDATE BUNDLES:
${JSON.stringify(compactBundles, null, 2)}

Remember: output ONLY the raw JSON array. No explanation. No code fences. No markdown.`;
}
}

/**
 * Strips accidental markdown fences and parses the JSON array.
 * Falls back to [] rather than throwing.
 * @param {string} raw
 * @returns {object[]}
 */
function parseGroqResponse(raw) {
  if (!raw || typeof raw !== "string") return [];

  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      console.error("[bundleEvaluator] Groq returned non-array JSON:", typeof parsed);
      return [];
    }
    return parsed;
  } catch (err) {
    console.error("[bundleEvaluator] Failed to parse Groq response:", err.message);
    console.error("[bundleEvaluator] Raw response was:", raw);
    return [];
  }
}

module.exports = { evaluateBundles };


function normalizeReturnedBundles(bundles, limit) {
  if (!Array.isArray(bundles)) return [];
  return bundles.slice(0, limit).map((bundle) => ({
    ...bundle,
    aiPreferenceMatches: Array.isArray(bundle.aiPreferenceMatches)
      ? bundle.aiPreferenceMatches
      : [],
    recommendationReasons: Array.isArray(bundle.recommendationReasons)
      ? bundle.recommendationReasons
      : defaultRecommendationReasons(bundle),
  }));
}

function defaultRecommendationReasons(bundle) {
  const reasons = [];
  if (bundle.preferenceMatch === "full") reasons.push("Matches your required filters");
  if (typeof bundle.budgetRemaining === "number" && bundle.budgetRemaining > 0) {
    reasons.push(`Stays ₹${Math.round(bundle.budgetRemaining).toLocaleString("en-IN")} under budget`);
  }
  if (bundle.hotelDetails?.rating) reasons.push(`${bundle.hotelDetails.rating}★ hotel rating`);
  return reasons.slice(0, 3);
}

function rankDiverseBundles(affordableBundles, nights, preferences, parsedAiPreferences, limit) {
  const budget = Number(preferences.budget) || Infinity;
  const sorted = [...affordableBundles].sort((a, b) => {
    const ratingDiff = (Number(b.hotel.rating) || 0) - (Number(a.hotel.rating) || 0);
    if (Math.abs(ratingDiff) >= 0.3) return ratingDiff;
    return a.calculatedTotalCost - b.calculatedTotalCost;
  });

  const selected = [];
  const seenHotels = new Set();

  for (const candidate of sorted) {
    const hotelName = String(candidate.hotel.name || candidate.hotel.hotelName || "").toLowerCase();
    if (!seenHotels.has(hotelName)) {
      selected.push(candidate);
      seenHotels.add(hotelName);
    }
    if (selected.length >= limit) break;
  }

  for (const candidate of sorted) {
    if (selected.includes(candidate)) continue;
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected.map((b) => {
    const hotelAmenities = Array.isArray(b.hotel.amenities) ? b.hotel.amenities : [];
    const aiMatches = buildAiPreferenceMatches(hotelAmenities, parsedAiPreferences);
    return {
      flightDetails: {
        airline: b.flight.airline || null,
        pricePerPerson: b.flight.price ?? null,
        departureTime: b.flight.departureTime || null,
        arrivalTime: b.flight.arrivalTime || null,
        stops: b.flight.stops ?? null,
        duration: b.flight.duration ?? null,
        bookingSite: b.flight.bookingSite || null,
        bookingUrl: b.flight.bookingUrl || null,
      },
      hotelDetails: {
        name: b.hotel.name || b.hotel.hotelName || null,
        rating: b.hotel.rating ?? null,
        pricePerNight: b.hotel.pricePerNight ?? null,
        amenities: hotelAmenities,
        bookingSite: b.hotel.bookingSite || null,
        bookingUrl: b.hotel.bookingUrl || null,
      },
      numberOfNights: nights,
      totalCost: b.calculatedTotalCost,
      budgetRemaining: b.calculatedBudgetRemaining,
      preferenceMatch: "full",
      preferencesMissed: [],
      aiPreferenceMatches: aiMatches,
      recommendationReasons: [
        "Diversified hotel recommendation",
        b.calculatedBudgetRemaining > 0
          ? `Stays ₹${Math.round(b.calculatedBudgetRemaining).toLocaleString("en-IN")} under budget`
          : "Fits your budget",
        ...(aiMatches.length > 0 ? aiMatches.slice(0, 1) : []),
      ].slice(0, 3),
      verdict: b.calculatedTotalCost < budget * 0.8 ? "good_deal" : "tight",
    };
  });
}

function buildAiPreferenceMatches(hotelAmenities, parsedAiPreferences) {
  const requested = Array.isArray(parsedAiPreferences?.hotelPreferences)
    ? parsedAiPreferences.hotelPreferences
    : [];
  const haystack = hotelAmenities.join(" ").toLowerCase();
  return requested
    .filter((pref) => {
      const normalized = String(pref).toLowerCase();
      if (normalized.includes("pet")) return /pet|pets/.test(haystack);
      return normalized.split(/\s+/).some((word) => word.length > 3 && haystack.includes(word));
    })
    .map((pref) => `AI preference matched: ${pref}`)
    .slice(0, 3);
}
