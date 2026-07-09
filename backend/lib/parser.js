/**
 * lib/parser.js
 *
 * Uses Groq (llama-3.3-70b-versatile) to filter and normalise raw
 * SerpApi / mock flight and hotel results according to the user's
 * preferences, returning a clean structured JSON object.
 */

/**
 * @typedef {Object} ParsedResults
 * @property {Array<{airline:string|null, price:number|null, departureTime:string|null,
 *   arrivalTime:string|null, stops:number|null, duration:number|null,
 *   bookingSite:string|null, bookingUrl:string|null}>} flights
 * @property {Array<{name:string|null, rating:number|null, pricePerNight:number|null,
 *   amenities:string[]|null, bookingSite:string|null, bookingUrl:string|null}>} hotels
 */

/**
 * Sends raw flight + hotel arrays and user preferences to Groq and returns
 * a normalised, filtered JSON result with at most 5 flights and 5 hotels.
 *
 * @param {object[]} flightResults  Raw array from searchFlights()
 * @param {object[]} hotelResults   Raw array from searchHotels()
 * @param {object}   preferences    User preferences object
 * @param {string}   preferences.origin
 * @param {string}   preferences.destination
 * @param {string}   preferences.checkIn       YYYY-MM-DD
 * @param {string}   preferences.checkOut      YYYY-MM-DD
 * @param {number}   preferences.travelers
 * @param {number}   preferences.budget        Total trip budget in INR
 * @param {string}   preferences.airlines      IATA code or "any"
 * @param {boolean}  preferences.directOnly
 * @param {string}   preferences.departureTime "morning"|"afternoon"|"evening"|"any"
 * @param {number}   preferences.minRating     0-5
 * @param {string[]} preferences.amenities
 * @returns {Promise<ParsedResults>}
 */
async function parseSearchResults(flightResults, hotelResults, preferences) {
  // When using mock data, skip Groq entirely — normalize directly
  if (process.env.USE_MOCK === "true") {
    return {
      flights: (flightResults || []).slice(0, 5).map((f) => ({
        airline: f.airline || null,
        price: f.price ?? null,
        departureTime: f.departureTime || null,
        arrivalTime: f.arrivalTime || null,
        stops: f.stops ?? null,
        duration: f.duration ?? null,
        bookingSite: f.bookingSite || null,
        bookingUrl: f.bookingUrl || null,
      })),
      hotels: (hotelResults || []).slice(0, 5).map((h) => ({
        name: h.hotelName || h.name || null,
        rating: h.rating ?? null,
        pricePerNight: h.pricePerNight ?? null,
        amenities: Array.isArray(h.amenities) ? h.amenities : null,
        bookingSite: h.bookingSite || null,
        bookingUrl: h.bookingUrl || null,
      })),
    };
  }

  const { groq } = require("./groq");

  const prompt = buildPrompt(flightResults, hotelResults, preferences);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a travel data processor. You receive raw flight and hotel search results along with user preferences. " +
          "Your ONLY job is to filter, normalise, and return the data as a valid JSON object. " +
          "Do NOT include any markdown, code fences, explanations, or extra text. " +
          "Output ONLY the raw JSON object — nothing before it, nothing after it.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
    max_tokens: 2048,
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  return parseGroqResponse(raw);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPrompt(flightResults, hotelResults, preferences) {
  const prefs = preferences || {};

  return `You are given raw flight results and hotel results, plus user preferences.
Apply the filtering rules below, then return ONLY a valid JSON object with this exact structure — absolutely no extra text, no markdown, no code blocks:

{
  "flights": [
    { "airline": string|null, "price": number|null, "departureTime": string|null, "arrivalTime": string|null, "stops": number|null, "duration": number|null, "bookingSite": string|null, "bookingUrl": string|null }
  ],
  "hotels": [
    { "name": string|null, "rating": number|null, "pricePerNight": number|null, "amenities": string[]|null, "bookingSite": string|null, "bookingUrl": string|null }
  ]
}

Rules:
1. FLIGHTS — include at most 5. Apply these filters in order:
   - directOnly: ${prefs.directOnly === true ? "YES — only include flights where stops === 0" : "NO — include any number of stops"}
   - airlines: ${prefs.airlines && prefs.airlines !== "any" ? `only include flights whose airline matches "${prefs.airlines}"` : "any airline is acceptable"}
   - departureTime: ${prefs.departureTime && prefs.departureTime !== "any" ? `prefer flights departing in the ${prefs.departureTime} (morning = 05:00–11:59, afternoon = 12:00–16:59, evening = 17:00–23:59)` : "any departure time is acceptable"}
   - If no flights pass the filters, return an empty array.
   - Map the raw fields to the output schema: airline→airline, price→price, departureTime→departureTime, arrivalTime→arrivalTime, stops→stops, duration→duration, bookingSite→bookingSite, bookingUrl→bookingUrl.
   - Use null for any missing field.

2. HOTELS — include at most 5. Apply these filters:
   - minRating: ${typeof prefs.minRating === "number" ? `only include hotels with rating >= ${prefs.minRating}` : "no minimum rating filter"}
   - amenities: ${Array.isArray(prefs.amenities) && prefs.amenities.length > 0 ? `prefer hotels that have ALL of these amenities: ${prefs.amenities.join(", ")}` : "no amenity filter required"}
   - If no hotels pass the filters, return an empty array.
   - Map: hotelName→name, rating→rating, pricePerNight→pricePerNight, amenities→amenities, bookingSite→bookingSite, bookingUrl→bookingUrl.
   - Use null for any missing field.

3. Do NOT modify, invent, or hallucinate values. Only use data from the arrays below.

USER PREFERENCES:
${JSON.stringify(
  {
    origin: prefs.origin,
    destination: prefs.destination,
    checkIn: prefs.checkIn,
    checkOut: prefs.checkOut,
    travelers: prefs.travelers,
    budget: prefs.budget,
  },
  null,
  2
)}

RAW FLIGHT RESULTS:
${JSON.stringify(flightResults, null, 2)}

RAW HOTEL RESULTS:
${JSON.stringify(hotelResults, null, 2)}

Remember: output ONLY the JSON object. No explanation. No code fences.`;
}

/**
 * Strips any accidental markdown fences and parses the JSON.
 * Falls back to an empty result rather than throwing.
 */
function parseGroqResponse(raw) {
  const empty = { flights: [], hotels: [] };
  if (!raw || typeof raw !== "string") return empty;

  // Strip leading/trailing whitespace and optional ```json … ``` fences.
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      flights: Array.isArray(parsed.flights) ? parsed.flights.slice(0, 5) : [],
      hotels: Array.isArray(parsed.hotels) ? parsed.hotels.slice(0, 5) : [],
    };
  } catch (err) {
    console.error("[parser] Failed to parse Groq response:", err.message);
    console.error("[parser] Raw response was:", raw);
    return empty;
  }
}

module.exports = { parseSearchResults };
