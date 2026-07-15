/**
 * lib/bundleEvaluator.js
 *
 * Evaluates and ranks flight × hotel bundles programmatically using
 * deterministic weighted scoring and structured AI preferences.
 *
 * Guardrails implemented:
 *   A – No fabricated attributes (only confirmed data drives reasons)
 *   B – Hard vs soft constraints
 *   C – Budget accuracy & pricing notes
 *   D – Deterministic label assignment
 *   E – Calibrated language (no "perfect match")
 *   F – Structured match/mismatch/unverified states
 *   G – Ambiguous requests surfaced as unresolved
 *   I – Reason objects tied to scoring logic
 */

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function calcNights(checkIn, checkOut) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const inMs = new Date(checkIn).getTime();
  const outMs = new Date(checkOut).getTime();
  if (Number.isNaN(inMs) || Number.isNaN(outMs) || outMs <= inMs) return 1;
  return Math.round((outMs - inMs) / msPerDay);
}

function flightLegMultiplier(preferences) {
  return preferences?.tripType === "oneWay" ? 1 : 2;
}

function getDepHour(departureTime) {
  return parseInt((departureTime || "12:00").split(":")[0], 10);
}

function matchesPeriod(hour, period) {
  const p = (period || "").toLowerCase();
  if (p.includes("morning")) return hour >= 5 && hour < 12;
  if (p.includes("afternoon")) return hour >= 12 && hour < 17;
  if (p.includes("evening")) return hour >= 17 && hour < 24;
  return false;
}

// ---------------------------------------------------------------------------
// Build candidate bundles (flight × hotel cross-join)
// ---------------------------------------------------------------------------

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
      bundles.push({
        flight,
        hotel,
        calculatedFlightCost: flightCost,
        calculatedHotelCost: hotelCost,
        calculatedTotalCost: totalCost,
        calculatedBudgetRemaining: budget - totalCost,
        fitsInBudget: totalCost <= budget,
      });
    }
  }
  return { bundles, nights };
}

// ---------------------------------------------------------------------------
// Evaluate a single candidate against hard/soft constraints + AI preferences
// ---------------------------------------------------------------------------

function evaluateCandidate(candidate, preferences, aiPrefs, budget) {
  const flight = candidate.flight;
  const hotel = candidate.hotel;
  const hotelAmenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
  const hotelAmenitiesLower = hotelAmenities.map((a) => a.toLowerCase());
  const hotelAmenitiesStr = hotelAmenitiesLower.join(" ");

  // Structured reason objects (Guardrail I)
  const reasons = []; // { preference_id, source_field, match_status, explanation }
  const hardViolations = [];

  // --- Sub-scores (0-100 each, will be weighted later) ---
  let priceScore = 0;
  let aiMatchScore = 0;
  let flightConvenienceScore = 0;
  let hotelSuitabilityScore = 0;
  let dataCompletenessScore = 0;

  // Track active ranking factors for transparency line
  const rankingFactors = [];

  // ===== HARD CONSTRAINTS (Guardrail B) =====

  // Budget is a hard constraint — bundles over budget are already filtered out
  // by fitsInBudget, but we record it for transparency.

  // Direct flights (when explicitly required)
  if (preferences.directOnly === true) {
    if ((flight.stops ?? 0) > 0) {
      hardViolations.push("Direct flights only (this flight has stops)");
      reasons.push({
        preference_id: "flight.direct_only",
        source_field: "flight.stops",
        match_status: "mismatch",
        explanation: `You required direct flights, but this flight has ${flight.stops} stop(s).`,
      });
    } else {
      reasons.push({
        preference_id: "flight.direct_only",
        source_field: "flight.stops",
        match_status: "confirmed",
        explanation: "Direct (non-stop) flight as required.",
      });
    }
  }

  // ===== SOFT / EXPLICIT FILTER PREFERENCES =====

  // Airline preference
  if (preferences.airlines && preferences.airlines !== "any") {
    if (flight.airline === preferences.airlines) {
      reasons.push({
        preference_id: "flight.airline",
        source_field: "flight.airline",
        match_status: "confirmed",
        explanation: `${preferences.airlines} airline as preferred.`,
      });
    } else {
      reasons.push({
        preference_id: "flight.airline",
        source_field: "flight.airline",
        match_status: "mismatch",
        explanation: `Preferred airline was ${preferences.airlines}, but this flight is ${flight.airline || "unknown"}.`,
      });
    }
  }

  // Departure time preference
  if (preferences.departureTime && preferences.departureTime !== "any") {
    const depHour = getDepHour(flight.departureTime);
    if (matchesPeriod(depHour, preferences.departureTime)) {
      flightConvenienceScore += 40;
      rankingFactors.push(`${preferences.departureTime} departure`);
      reasons.push({
        preference_id: "flight.departure_time",
        source_field: "flight.departureTime",
        match_status: "confirmed",
        explanation: `${preferences.departureTime.charAt(0).toUpperCase() + preferences.departureTime.slice(1)} departure — flight departs at ${flight.departureTime}.`,
      });
    } else {
      reasons.push({
        preference_id: "flight.departure_time",
        source_field: "flight.departureTime",
        match_status: "mismatch",
        explanation: `Preferred ${preferences.departureTime} departure, but this flight departs at ${flight.departureTime}.`,
      });
    }
  }

  // Min hotel rating
  if (typeof preferences.minRating === "number" && preferences.minRating > 0) {
    if ((hotel.rating || 0) >= preferences.minRating) {
      reasons.push({
        preference_id: "hotel.min_rating",
        source_field: "hotel.rating",
        match_status: "confirmed",
        explanation: `Hotel rated ${hotel.rating}★, meeting your ${preferences.minRating}★ minimum.`,
      });
    } else {
      reasons.push({
        preference_id: "hotel.min_rating",
        source_field: "hotel.rating",
        match_status: "mismatch",
        explanation: `Hotel rated ${hotel.rating || "unknown"}★, below your ${preferences.minRating}★ minimum.`,
      });
    }
  }

  // Amenity preferences
  if (Array.isArray(preferences.amenities) && preferences.amenities.length > 0) {
    for (const reqAm of preferences.amenities) {
      const found = hotelAmenitiesLower.some((a) => a.includes(reqAm.toLowerCase()));
      reasons.push({
        preference_id: `hotel.amenity.${reqAm.toLowerCase().replace(/\s+/g, "_")}`,
        source_field: "hotel.amenities",
        match_status: found ? "confirmed" : "mismatch",
        explanation: found
          ? `Hotel offers ${reqAm}.`
          : `${reqAm} is not listed in this hotel's amenities.`,
      });
    }
  }

  // ===== AI PREFERENCES (Guardrail A — only confirmed data) =====

  const hotelP = aiPrefs.hotel_preferences || {};
  const flightP = aiPrefs.flight_preferences || {};
  const travP = aiPrefs.traveller_preferences || {};

  // Pet-friendly
  if (hotelP.pet_friendly) {
    const found = /pet[- ]?friendly|pets?\s*allowed/i.test(hotelAmenitiesStr);
    if (found) {
      aiMatchScore += 40;
      rankingFactors.push("pet-friendly accommodation");
      reasons.push({
        preference_id: "hotel.pet_friendly",
        source_field: "hotel.amenities",
        match_status: "confirmed",
        explanation: "You requested a pet-friendly stay, and this hotel is listed as pet-friendly.",
      });
    } else {
      reasons.push({
        preference_id: "hotel.pet_friendly",
        source_field: "hotel.amenities",
        match_status: "unverified",
        explanation: "Pet-friendly status could not be verified from the available data.",
      });
    }
  }

  // Breakfast — distinguish free vs paid (Guardrail A)
  if (hotelP.breakfast_included) {
    const hasFreeBreakfast = hotelAmenitiesLower.some(
      (a) => a.includes("free breakfast")
    );
    const hasPaidBreakfast = hotelAmenitiesLower.some(
      (a) => /breakfast\s*\(\$\)/i.test(a) || (a.includes("breakfast") && !a.includes("free"))
    );

    if (hasFreeBreakfast) {
      aiMatchScore += 40;
      rankingFactors.push("free breakfast");
      reasons.push({
        preference_id: "hotel.breakfast",
        source_field: "hotel.amenities",
        match_status: "confirmed",
        explanation: "You wanted breakfast included, and this hotel offers free breakfast.",
      });
    } else if (hasPaidBreakfast) {
      reasons.push({
        preference_id: "hotel.breakfast",
        source_field: "hotel.amenities",
        match_status: "mismatch",
        explanation: "Breakfast is available but at an extra cost — it is not confirmed as free.",
      });
    } else {
      reasons.push({
        preference_id: "hotel.breakfast",
        source_field: "hotel.amenities",
        match_status: "unverified",
        explanation: "Breakfast availability could not be verified from the available data.",
      });
    }
  }

  // Location preference (Guardrail A — only match if data exists)
  if (hotelP.location_preference) {
    const locPref = hotelP.location_preference.toLowerCase();
    const nameMatch = hotel.name?.toLowerCase().includes(locPref);
    // We do NOT claim a match without reliable location data
    if (nameMatch) {
      aiMatchScore += 20;
      reasons.push({
        preference_id: "hotel.location",
        source_field: "hotel.name",
        match_status: "confirmed",
        explanation: `Hotel name suggests it matches your "${hotelP.location_preference}" preference.`,
      });
    } else {
      reasons.push({
        preference_id: "hotel.location",
        source_field: "hotel.name",
        match_status: "unverified",
        explanation: `"${hotelP.location_preference}" could not be verified — no reliable location data available.`,
      });
    }
  }

  // Maximum stops (AI preference)
  if (flightP.maximum_stops !== undefined && flightP.maximum_stops !== null) {
    if ((flight.stops ?? 99) <= flightP.maximum_stops) {
      aiMatchScore += 30;
      reasons.push({
        preference_id: "flight.max_stops",
        source_field: "flight.stops",
        match_status: "confirmed",
        explanation: `You wanted at most ${flightP.maximum_stops} stop(s), and this flight has ${flight.stops ?? 0}.`,
      });
    } else {
      reasons.push({
        preference_id: "flight.max_stops",
        source_field: "flight.stops",
        match_status: "mismatch",
        explanation: `You wanted at most ${flightP.maximum_stops} stop(s), but this flight has ${flight.stops}.`,
      });
    }
  }

  // Departure period (AI preference)
  if (flightP.departure_period) {
    const depHour = getDepHour(flight.departureTime);
    const period = flightP.departure_period.toLowerCase();
    if (matchesPeriod(depHour, period)) {
      aiMatchScore += 30;
      rankingFactors.push(`${period} departure`);
      reasons.push({
        preference_id: "flight.departure_period",
        source_field: "flight.departureTime",
        match_status: "confirmed",
        explanation: `You preferred a ${period} departure, and this flight leaves at ${flight.departureTime}.`,
      });
    } else {
      reasons.push({
        preference_id: "flight.departure_period",
        source_field: "flight.departureTime",
        match_status: "mismatch",
        explanation: `You preferred a ${period} departure, but this flight departs at ${flight.departureTime}.`,
      });
    }
  }

  // Avoid overnight (hard constraint)
  if (flightP.avoid_overnight) {
    const depHour = getDepHour(flight.departureTime);
    const arrHour = getDepHour(flight.arrivalTime);
    const isOvernight = depHour >= 22 || (depHour >= 18 && arrHour < 6);
    if (isOvernight) {
      hardViolations.push("Avoid overnight flights");
      reasons.push({
        preference_id: "flight.avoid_overnight",
        source_field: "flight.departureTime",
        match_status: "mismatch",
        explanation: "You asked to avoid overnight flights, but this flight departs late evening.",
      });
    } else {
      reasons.push({
        preference_id: "flight.avoid_overnight",
        source_field: "flight.departureTime",
        match_status: "confirmed",
        explanation: "Flight avoids overnight travel as requested.",
      });
    }
  }

  // Travelling with children
  if (travP.travelling_with_children) {
    const kidFriendly = /kid|child|family/i.test(hotelAmenitiesStr);
    if (kidFriendly) {
      aiMatchScore += 20;
      reasons.push({
        preference_id: "traveller.children",
        source_field: "hotel.amenities",
        match_status: "confirmed",
        explanation: "Hotel is listed as kid-friendly for your family.",
      });
    } else {
      reasons.push({
        preference_id: "traveller.children",
        source_field: "hotel.amenities",
        match_status: "unverified",
        explanation: "Kid-friendly status could not be verified from the available data.",
      });
    }
  }

  // Unresolved / ambiguous requests (Guardrail G)
  const unresolvedRequests = aiPrefs.unresolved_requests || [];
  for (const unresolved of unresolvedRequests) {
    reasons.push({
      preference_id: "unresolved",
      source_field: null,
      match_status: "unresolved",
      explanation: `Could not apply: "${unresolved}" — insufficient information to evaluate.`,
    });
  }

  // Soft preferences from parser
  const softPreferences = aiPrefs.soft_preferences || [];
  for (const soft of softPreferences) {
    // Generic soft prefs — try matching against amenities
    const softLower = String(soft).toLowerCase();
    const found = hotelAmenitiesLower.some((a) => a.includes(softLower));
    if (found) {
      aiMatchScore += 10;
      reasons.push({
        preference_id: `soft.${softLower.replace(/\s+/g, "_")}`,
        source_field: "hotel.amenities",
        match_status: "confirmed",
        explanation: `Hotel offers "${soft}" as you mentioned.`,
      });
    }
  }

  // ===== COMPUTE SUB-SCORES =====

  // Price suitability (0-100): lower cost relative to budget = higher score
  if (budget > 0 && budget < Infinity) {
    const ratio = candidate.calculatedTotalCost / budget;
    priceScore = Math.max(0, Math.min(100, (1 - ratio) * 200)); // 50% of budget = 100, at budget = 0
    rankingFactors.push("total price");
  }

  // Flight convenience
  flightConvenienceScore += (flight.stops === 0) ? 30 : (flight.stops === 1 ? 15 : 0);
  if (flight.duration) {
    flightConvenienceScore += Math.max(0, 30 - (flight.duration / 30)); // shorter = better
  }

  // Hotel suitability
  hotelSuitabilityScore = Math.min(100, ((hotel.rating || 0) / 5) * 60);
  hotelSuitabilityScore += Math.min(40, hotelAmenities.length * 3);

  // Data completeness
  let completenessPoints = 0;
  if (flight.airline) completenessPoints += 15;
  if (flight.departureTime) completenessPoints += 15;
  if (flight.arrivalTime) completenessPoints += 10;
  if (flight.bookingUrl) completenessPoints += 10;
  if (hotel.name) completenessPoints += 10;
  if (hotel.rating) completenessPoints += 10;
  if (hotel.bookingUrl) completenessPoints += 10;
  if (hotelAmenities.length > 0) completenessPoints += 10;
  if (hotel.image) completenessPoints += 10;
  dataCompletenessScore = Math.min(100, completenessPoints);

  // Cap AI match score
  aiMatchScore = Math.min(100, aiMatchScore);

  // ===== WEIGHTED OVERALL SCORE =====
  const overallScore =
    priceScore * 0.35 +
    aiMatchScore * 0.25 +
    flightConvenienceScore * 0.15 +
    hotelSuitabilityScore * 0.15 +
    dataCompletenessScore * 0.10;

  // Determine preferenceMatch
  const hasHardViolation = hardViolations.length > 0;
  const confirmedReasons = reasons.filter((r) => r.match_status === "confirmed");
  const mismatchedReasons = reasons.filter((r) => r.match_status === "mismatch");
  const totalChecked = confirmedReasons.length + mismatchedReasons.length;
  const preferenceMatch = hasHardViolation || mismatchedReasons.length > 0 ? "partial" : "full";

  // Preference count summary for calibrated language (Guardrail E)
  const matchSummary = totalChecked > 0
    ? `Matches ${confirmedReasons.length} of ${totalChecked} preferences`
    : null;

  // De-duplicate ranking factors
  const uniqueFactors = [...new Set(rankingFactors)];

  return {
    overallScore,
    preferenceMatch,
    hardViolations,
    reasons,
    matchSummary,
    rankingFactors: uniqueFactors,
    subScores: { priceScore, aiMatchScore, flightConvenienceScore, hotelSuitabilityScore, dataCompletenessScore },
  };
}

// ---------------------------------------------------------------------------
// Assign deterministic labels (Guardrail D)
// ---------------------------------------------------------------------------

function assignLabels(sortedBundles) {
  if (sortedBundles.length === 0) return;

  const usedIndices = new Set();

  // Best Overall — rank 1, but ONLY if it has no hard violations (Guardrail B)
  if (sortedBundles[0].preferenceMatch === "full") {
    sortedBundles[0].rankLabel = "Best Overall";
    usedIndices.add(0);
  } else {
    // Find first bundle with full match
    const fullMatchIdx = sortedBundles.findIndex((b) => b.preferenceMatch === "full");
    if (fullMatchIdx >= 0) {
      sortedBundles[fullMatchIdx].rankLabel = "Best Overall";
      usedIndices.add(fullMatchIdx);
    }
    // If none has full match, no Best Overall label at all
  }

  // Cheapest — lowest totalCost among remaining
  let cheapestIdx = -1;
  let cheapestCost = Infinity;
  for (let i = 0; i < sortedBundles.length; i++) {
    if (usedIndices.has(i)) continue;
    if (sortedBundles[i].totalCost < cheapestCost) {
      cheapestCost = sortedBundles[i].totalCost;
      cheapestIdx = i;
    }
  }
  if (cheapestIdx >= 0) {
    sortedBundles[cheapestIdx].rankLabel = "Cheapest";
    usedIndices.add(cheapestIdx);
  }

  // Best Hotel — highest hotel suitability sub-score among remaining
  let bestHotelIdx = -1;
  let bestHotelScore = -1;
  for (let i = 0; i < sortedBundles.length; i++) {
    if (usedIndices.has(i)) continue;
    const hs = sortedBundles[i].subScores?.hotelSuitabilityScore ?? 0;
    if (hs > bestHotelScore) {
      bestHotelScore = hs;
      bestHotelIdx = i;
    }
  }
  if (bestHotelIdx >= 0) {
    sortedBundles[bestHotelIdx].rankLabel = "Best Hotel";
    usedIndices.add(bestHotelIdx);
  }

  // Best Flight Time — best flight convenience score among remaining
  let bestFlightIdx = -1;
  let bestFlightScore = -1;
  for (let i = 0; i < sortedBundles.length; i++) {
    if (usedIndices.has(i)) continue;
    const fs = sortedBundles[i].subScores?.flightConvenienceScore ?? 0;
    if (fs > bestFlightScore) {
      bestFlightScore = fs;
      bestFlightIdx = i;
    }
  }
  if (bestFlightIdx >= 0) {
    sortedBundles[bestFlightIdx].rankLabel = "Best Flight Time";
    usedIndices.add(bestFlightIdx);
  }
}

// ---------------------------------------------------------------------------
// Main ranking pipeline
// ---------------------------------------------------------------------------

function rankBundles(affordableBundles, nights, preferences, parsedAiPreferences, limit) {
  const budget = Number(preferences.budget) || Infinity;
  const travelers = Number(preferences.travelers) || 1;

  const evaluated = affordableBundles.map((bundle) => {
    const evalResult = evaluateCandidate(bundle, preferences, parsedAiPreferences, budget);
    return { bundle, ...evalResult };
  });

  // Sort by overall score descending, then cost ascending
  evaluated.sort((a, b) => {
    if (Math.abs(b.overallScore - a.overallScore) > 0.5) return b.overallScore - a.overallScore;
    return a.bundle.calculatedTotalCost - b.bundle.calculatedTotalCost;
  });

  // Diversity pass — prefer unique hotels in the top slots
  const selected = [];
  const seenHotels = new Set();

  for (const candidate of evaluated) {
    const hotelName = String(candidate.bundle.hotel.name || candidate.bundle.hotel.hotelName || "").toLowerCase();
    if (!seenHotels.has(hotelName)) {
      selected.push(candidate);
      seenHotels.add(hotelName);
    }
    if (selected.length >= limit) break;
  }
  for (const candidate of evaluated) {
    if (selected.includes(candidate)) continue;
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  // Build output bundles
  const output = selected.map((item) => {
    const b = item.bundle;
    const confirmedReasons = item.reasons.filter((r) => r.match_status === "confirmed");

    // Pricing note (Guardrail C)
    const pricingNote = `Total currently available price for ${travelers} adult${travelers > 1 ? "s" : ""}. Optional add-ons (baggage, seat selection, meals, transfers, insurance) may cost extra.`;

    // Ranking factors transparency line (Guardrail D)
    const rankingFactorsLine = item.rankingFactors.length > 0
      ? `Ranked primarily by: ${item.rankingFactors.join(", ")}.`
      : "Ranked by overall score across price, hotel quality, and flight convenience.";

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
        amenities: Array.isArray(b.hotel.amenities) ? b.hotel.amenities : [],
        bookingSite: b.hotel.bookingSite || null,
        bookingUrl: b.hotel.bookingUrl || null,
        image: b.hotel.image || null,
      },
      numberOfNights: nights,
      totalCost: b.calculatedTotalCost,
      budgetRemaining: b.calculatedBudgetRemaining,
      preferenceMatch: item.preferenceMatch,
      hardViolations: item.hardViolations,
      matchSummary: item.matchSummary,
      reasons: item.reasons,
      // Legacy fields for backwards compat with existing UI during transition
      aiPreferenceMatches: confirmedReasons.map((r) => r.explanation),
      recommendationReasons: confirmedReasons.slice(0, 3).map((r) => r.explanation),
      preferencesMissed: item.reasons
        .filter((r) => r.match_status === "mismatch" || r.match_status === "unresolved")
        .map((r) => r.explanation),
      pricingNote,
      rankLabel: null, // assigned after sorting
      rankingFactors: rankingFactorsLine,
      subScores: item.subScores,
      verdict: b.calculatedTotalCost < budget * 0.8 ? "good_deal" : "tight",
    };
  });

  // Assign deterministic labels (Guardrail D)
  assignLabels(output);

  return output;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function evaluateBundles(parsedData, preferences, parsedAiPreferences = {}) {
  const flights = Array.isArray(parsedData?.flights) ? parsedData.flights : [];
  const hotels = Array.isArray(parsedData?.hotels) ? parsedData.hotels : [];

  if (flights.length === 0 || hotels.length === 0) return [];

  const nights = calcNights(preferences.checkIn, preferences.checkOut);
  const { bundles } = buildCandidateBundles(flights, hotels, preferences);
  const affordableBundles = bundles.filter((b) => b.fitsInBudget);

  return rankBundles(affordableBundles, nights, preferences, parsedAiPreferences, 12);
}

module.exports = { evaluateBundles };
