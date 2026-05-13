const { searchFlights, searchHotels } = require("./search.js");

(async function main() {
  // Next.js loads `.env.local` automatically, but plain `node` scripts don't.
  // Load it here so the test can hit SerpApi when run locally.
  if (!process.env.SERPAPI_KEY) {
    try {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.join(process.cwd(), ".env.local");
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const k = trimmed.slice(0, eq).trim();
        const v = trimmed.slice(eq + 1).trim();
        process.env[k] = v;
      }
    } catch (_e) {
      // If this fails, the search functions will just return [].
    }
  }

  const origin = "Nagpur";
  const destination = "Goa";
  /** October 15–17 / 2026 (month index 9 = October) */
  const flightDate = new Date(2026, 9, 15);
  const checkIn = new Date(2026, 9, 15);
  const checkOut = new Date(2026, 9, 17);
  const travelers = 2;

  const preferences = {
    airlines: "any",
    directOnly: false,
    departureTime: "any",
    minRating: 3,
    amenities: [],
  };

  try {
    console.log("\n=== searchFlights ===\n");
    const flights = await searchFlights(
      origin,
      destination,
      flightDate,
      travelers,
      preferences
    );
    console.log(JSON.stringify(flights, null, 2));

    console.log("\n=== searchHotels ===\n");
    const hotels = await searchHotels(
      destination,
      checkIn,
      checkOut,
      travelers,
      preferences
    );
    console.log(JSON.stringify(hotels, null, 2));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
