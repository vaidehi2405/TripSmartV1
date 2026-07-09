const express = require("express");
const router = express.Router();

const { searchFlights, searchHotels } = require("../lib/search");
const { parseSearchResults } = require("../lib/parser");
const { evaluateBundles } = require("../lib/bundleEvaluator");
const { parseTripPreferences } = require("../lib/preferenceParser");
const { explainEmptySearch } = require("../lib/searchMeta");

function explainEmptySearchResponse(ctx) {
  return explainEmptySearch(ctx);
}

router.post("/", async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences || !preferences.origin || !preferences.destination) {
      return res.status(400).json({ error: "Missing required preferences" });
    }

    const flightDate = new Date(preferences.checkIn);
    const checkIn = new Date(preferences.checkIn);
    const checkOut = new Date(preferences.checkOut);
    const hotelDestination = preferences.destinationCity || preferences.destination;

    const [rawFlights, rawHotels] = await Promise.all([
      searchFlights(
        preferences.originCode || preferences.origin,
        preferences.destinationCode || preferences.destination,
        flightDate,
        preferences.travelers,
        preferences
      ),
      searchHotels(
        hotelDestination,
        checkIn,
        checkOut,
        preferences.travelers,
        preferences
      ),
    ]);

    const parsedData = await parseSearchResults(rawFlights, rawHotels, preferences);
    const parsedAiPreferences = await parseTripPreferences(preferences.hotelPreferenceText || "");
    const bundles = await evaluateBundles(parsedData, preferences, parsedAiPreferences);

    if (bundles.length > 0) {
      return res.status(200).json({ bundles });
    }

    const meta = explainEmptySearch({
      rawFlights,
      rawHotels,
      parsedData,
      preferences: { ...preferences, destination: hotelDestination },
    });

    return res.status(200).json({ bundles: [], meta });
  } catch (error) {
    console.error("[api/search] Error processing search:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
