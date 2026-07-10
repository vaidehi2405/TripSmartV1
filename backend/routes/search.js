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

    const [parsedData, parsedAiPreferences] = await Promise.all([
      parseSearchResults(rawFlights, rawHotels, preferences),
      parseTripPreferences(preferences.hotelPreferenceText || "")
    ]);
    const bundles = await evaluateBundles(parsedData, preferences, parsedAiPreferences);

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    if (bundles.length === 0) {
      const meta = explainEmptySearch({
        rawFlights,
        rawHotels,
        parsedData,
        preferences: { ...preferences, destination: hotelDestination },
      });
      res.write(JSON.stringify({ type: "meta", data: meta }) + "\n");
      res.end();
      return;
    }

    for (const bundle of bundles) {
      res.write(JSON.stringify({ type: "bundle", data: bundle }) + "\n");
      // Tiny delay to create a smooth, modern streaming look in the UI
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    res.end();
  } catch (error) {
    console.error("[api/search] Error processing search:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.end();
  }
});

module.exports = router;
