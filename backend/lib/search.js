const { getJson } = require("serpapi");

function debugLog(runId, hypothesisId, location, message, data) {
  // #region agent log
  fetch("http://127.0.0.1:7736/ingest/3b3f81b6-4a6e-401c-8d6c-339e000c7322", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "fb73af",
    },
    body: JSON.stringify({
      sessionId: "fb73af",
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function toYYYYMMDD(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Assume caller passes already formatted YYYY-MM-DD (or ISO-like strings).
  return String(value).slice(0, 10);
}

function timeOnly(timeStr) {
  if (!timeStr) return "";
  // SerpApi typically returns "YYYY-MM-DD HH:MM".
  const parts = String(timeStr).split(" ");
  return parts.length >= 2 ? parts[parts.length - 1] : String(timeStr);
}
function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ratingParamFromMinRating(minRating) {
  const r = Number(minRating);
  if (!Number.isFinite(r)) return undefined;

  // SerpApi supports discrete options:
  // 7 - 3.5+, 8 - 4.0+, 9 - 4.5+
  if (r >= 4.5) return "9";
  if (r >= 4.0) return "8";
  if (r >= 3.5) return "7";
  return undefined;
}

function outboundTimesFromDepartureTime(departureTime) {
  // SerpApi expects "beginning of hour" ranges, comma-separated integers.
  // Example in docs: "4,18" means 4:00 AM - 7:00 PM (departure only).
  switch (departureTime) {
    case "morning":
      return "5,12"; // 5:00 AM - ~12:59 PM
    case "afternoon":
      return "12,17"; // ~12:00 PM - ~4:59 PM
    case "evening":
      return "17,23"; // ~5:00 PM - ~11:59 PM
    default:
      return undefined; // any
  }
}

function airlineCodeFromPreference(airlinesPref) {
  if (!airlinesPref || airlinesPref === "any") return undefined;
  const code = String(airlinesPref).trim().toUpperCase();
  // SerpApi expects 2-character IATA codes, or specific alliance tokens.
  if (/^[A-Z0-9]{2}$/.test(code)) return code;
  if (/^(STAR_ALLIANCE|SKYTEAM|ONEWORLD)$/.test(code)) return code;
  return undefined;
}

function amenitiesParamFromPreference(amenities) {
  if (!Array.isArray(amenities) || amenities.length === 0) return undefined;
  const ids = amenities
    .map((a) => {
      if (typeof a === "number" && Number.isFinite(a)) return String(a);
      const s = String(a).trim();
      return /^[0-9]+$/.test(s) ? s : null;
    })
    .filter(Boolean);
  if (ids.length === 0) return undefined;
  return ids.join(",");
}

async function serpapiGetJson(params) {
  const json = await getJson(params);
  if (json && typeof json === "object" && json.error) {
    throw new Error(String(json.error));
  }

  const status = json?.search_metadata?.status;
  if (status && status !== "Success") {
    const errMsg =
      json?.search_metadata?.error ||
      json?.search_metadata?.status_message ||
      `SerpApi status: ${status}`;
    throw new Error(String(errMsg));
  }

  return json;
}

function normalizeAirportId(value) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;

  // City-to-IATA fallback for cases where the frontend sends a city label
  // instead of a formatted "City (IATA)" value.
  const cityToIata = {
    MUMBAI: "BOM",
    DELHI: "DEL",
    HYDERABAD: "HYD",
    BENGALURU: "BLR",
    BANGALORE: "BLR",
    CHENNAI: "MAA",
    KOLKATA: "CCU",
    KOCHI: "COK",
    COCHIN: "COK",
    NAGPUR: "NAG",
    GOA: "GOI",
    DUBAI: "DXB",
    SINGAPORE: "SIN",
    BALI: "DPS",
    TOKYO: "HND",
    LONDON: "LHR",
    "NEW YORK": "JFK",
  };
  return cityToIata[upper] || raw;
}

async function searchFlights(origin, destination, date, travelers, preferences) {
  if (process.env.USE_MOCK === "true") {
    const { getMockFlights } = require("./mockData.js");
    return getMockFlights(origin, destination);
  }
  const key = process.env.SERPAPI_KEY;
  // #region agent log
  debugLog("pre-fix", "H1", "lib/search.js:164", "searchFlights_entry", {
    hasSerpApiKey: Boolean(key),
    origin,
    destination,
    travelers,
    dateType: typeof date,
  });
  // #endregion
  if (!key) return [];

  try {
    const departureDate = toYYYYMMDD(date);
    const prefs = preferences || {};
    const adults = Number(travelers);
    if (!Number.isFinite(adults) || adults <= 0) return [];

    const departureId = normalizeAirportId(prefs.originCode || origin);
    const arrivalId = normalizeAirportId(prefs.destinationCode || destination);

    const params = {
      engine: "google_flights",
      api_key: key,
      hl: "en",
      gl: "in",
      currency: "INR",

      // One-way search (no return_date).
      type: "2",
      departure_id: departureId,
      arrival_id: arrivalId,
      outbound_date: departureDate,
      adults: String(adults),
      sort_by: "1",
    };

    // Apply preferences where supported.
    if (prefs.directOnly === true) {
      // stops: 1 = Nonstop only
      params.stops = "1";
    }

    const outboundTimes = outboundTimesFromDepartureTime(prefs.departureTime);
    if (outboundTimes) params.outbound_times = outboundTimes;

    const airlineCode = airlineCodeFromPreference(prefs.airlines);
    if (airlineCode) params.include_airlines = airlineCode;

    // #region agent log
    debugLog("pre-fix", "H2", "lib/search.js:203", "searchFlights_request_params", {
      engine: params.engine,
      departure_id: params.departure_id,
      arrival_id: params.arrival_id,
      outbound_date: params.outbound_date,
      adults: params.adults,
      stops: params.stops || null,
      outbound_times: params.outbound_times || null,
      include_airlines: params.include_airlines || null,
    });
    // #endregion

    const resultsJson = await serpapiGetJson(params);
    // #region agent log
    debugLog("pre-fix", "H3", "lib/search.js:217", "searchFlights_results_shape", {
      bestFlightsCount: Array.isArray(resultsJson?.best_flights)
        ? resultsJson.best_flights.length
        : null,
      otherFlightsCount: Array.isArray(resultsJson?.other_flights)
        ? resultsJson.other_flights.length
        : null,
      hasErrorField: Boolean(resultsJson?.error),
    });
    // #endregion
    const itineraries =
      resultsJson.best_flights || resultsJson.other_flights || [];

    const top = Array.isArray(itineraries) ? itineraries.slice(0, 5) : [];

    const mapped = await Promise.all(top.map(async (itinerary) => {
      const bookingToken = itinerary?.booking_token;

      let bookingSite = "";
      let bookingUrl = "";
      if (bookingToken) {
        const bookingJson = await serpapiGetJson({
          ...params,
          booking_token: bookingToken,
        });

        const bookingOptions = bookingJson?.booking_options;
        const opt0 = Array.isArray(bookingOptions) ? bookingOptions[0] : null;
        const together =
          opt0?.together || opt0?.separate_tickets?.together || opt0;
        bookingSite = together?.book_with || "";
        bookingUrl = together?.booking_request?.url || "";
      }

      const segs = Array.isArray(itinerary?.flights) ? itinerary.flights : [];
      const firstSeg = segs[0];
      const lastSeg = segs[segs.length - 1];
      const airline = firstSeg?.airline || "";

      const price = asNumber(itinerary?.price);
      // SerpApi returns the total price for all adults.
      // We divide by the traveler count (adults) to get the price per person to prevent double-counting.
      const pricePerPerson = price ? price / adults : 0;
      const stops = Array.isArray(itinerary?.layovers)
        ? itinerary.layovers.length
        : 0;
      const duration = asNumber(itinerary?.total_duration) || 0;

      return {
        airline,
        price: pricePerPerson,
        departureTime: timeOnly(firstSeg?.departure_airport?.time),
        arrivalTime: timeOnly(lastSeg?.arrival_airport?.time),
        stops,
        duration,
        bookingSite,
        bookingUrl,
      };
    }));

    return mapped.slice(0, 5);
  } catch (_err) {
    // #region agent log
    debugLog("pre-fix", "H3", "lib/search.js:274", "searchFlights_catch", {
      errorMessage: _err?.message || String(_err),
      errorName: _err?.name || null,
    });
    // #endregion
    return [];
  }
}

async function searchHotels(
  destination,
  checkIn,
  checkOut,
  travelers,
  preferences
) {
  if (process.env.USE_MOCK === "true") {
    const { getMockHotels } = require("./mockData.js");
    return getMockHotels(destination);
  }
  const key = process.env.SERPAPI_KEY;
  // #region agent log
  debugLog("pre-fix", "H1", "lib/search.js:287", "searchHotels_entry", {
    hasSerpApiKey: Boolean(key),
    destination,
    travelers,
  });
  // #endregion
  if (!key) return [];

  try {
    const prefs = preferences || {};
    const adults = Number(travelers);
    if (!Number.isFinite(adults) || adults <= 0) return [];

    const checkInDate = toYYYYMMDD(checkIn);
    const checkOutDate = toYYYYMMDD(checkOut);
    const minRating = Number(prefs.minRating);

    const params = {
      engine: "google_hotels",
      api_key: key,
      q: destination,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      adults: String(adults),
      children: "0",
      currency: "INR",
      hl: "en",
      gl: "in",
    };

    const ratingParam = ratingParamFromMinRating(minRating);
    if (ratingParam) params.rating = ratingParam;

    const amenitiesParam = amenitiesParamFromPreference(prefs.amenities);
    if (amenitiesParam) params.amenities = amenitiesParam;

    // #region agent log
    debugLog("pre-fix", "H2", "lib/search.js:319", "searchHotels_request_params", {
      engine: params.engine,
      q: params.q,
      check_in_date: params.check_in_date,
      check_out_date: params.check_out_date,
      adults: params.adults,
      rating: params.rating || null,
      amenities: params.amenities || null,
    });
    // #endregion

    const resultsJson = await serpapiGetJson(params);
    const properties = Array.isArray(resultsJson.properties)
      ? resultsJson.properties
      : [];
    // #region agent log
    debugLog("pre-fix", "H4", "lib/search.js:334", "searchHotels_pre_filter_counts", {
      propertiesCount: properties.length,
      minRating,
    });
    // #endregion

    const filtered = properties
      .filter((p) => {
        // Prefer only hotel-type properties.
        if (typeof p?.type === "string") {
          const t = p.type.toLowerCase();
          if (!t.includes("hotel")) return false;
        }

        if (Number.isFinite(minRating) && !Number.isNaN(minRating)) {
          const r = asNumber(p?.overall_rating);
          if (r === null) return false;
          if (r < minRating) return false;
        }
        return true;
      })
      .slice(0, 5);

    return filtered.map((p) => {
      const hotelName = p?.name || "";
      const rating = asNumber(p?.overall_rating) ?? 0;
      const pricePerNight =
        asNumber(p?.rate_per_night?.extracted_lowest) ??
        asNumber(p?.rate_per_night?.extracted_before_taxes_fees) ??
        0;
      const amenities = Array.isArray(p?.amenities) ? p.amenities : [];

      const bookingSite =
        Array.isArray(p?.prices) && p.prices[0]?.source ? p.prices[0].source : "";
      const bookingUrl = p?.link || "";
      const image = p?.thumbnail || p?.images?.[0] || "";

      return {
        hotelName,
        rating,
        pricePerNight,
        amenities,
        bookingSite,
        bookingUrl,
        image,
      };
    });
  } catch (_err) {
    // #region agent log
    debugLog("pre-fix", "H3", "lib/search.js:378", "searchHotels_catch", {
      errorMessage: _err?.message || String(_err),
      errorName: _err?.name || null,
    });
    // #endregion
    return [];
  }
}

module.exports = {
  searchFlights,
  searchHotels,
};
