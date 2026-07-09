const { searchFlights, searchHotels } = require("../lib/search.js");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

(async function main() {
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
