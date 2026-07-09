/**
 * lib/manual-test.js
 *
 * Manual integration test for:
 *   - Milestone 3: parseSearchResults()
 *   - Milestone 4: evaluateBundles()
 *
 * Run with:  node lib/manual-test.js
 *
 * Requires GROQ_API_KEY in .env.local (loaded automatically below).
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const { parseSearchResults } = require("../lib/parser.js");
const { evaluateBundles } = require("../lib/bundleEvaluator.js");

// ---------------------------------------------------------------------------
// Hardcoded mock inputs — matches the data returned by mockData.js
// ---------------------------------------------------------------------------

const mockFlights = [
  {
    airline: "IndiGo",
    price: 5480,
    departureTime: "06:35",
    arrivalTime: "08:05",
    stops: 0,
    duration: 90,
    bookingSite: "IndiGo",
    bookingUrl: "https://www.goindigo.in/",
  },
  {
    airline: "IndiGo",
    price: 6120,
    departureTime: "11:20",
    arrivalTime: "13:10",
    stops: 0,
    duration: 110,
    bookingSite: "MakeMyTrip",
    bookingUrl: "https://www.makemytrip.com/flights/",
  },
  {
    airline: "IndiGo",
    price: 7320,
    departureTime: "18:10",
    arrivalTime: "21:00",
    stops: 1,
    duration: 170,
    bookingSite: "ixigo",
    bookingUrl: "https://www.ixigo.com/flights",
  },
];

const mockHotels = [
  {
    hotelName: "Taj Fort Aguada Resort & Spa, Goa",
    rating: 4.6,
    pricePerNight: 14250,
    amenities: ["Free Wi-Fi", "Pool", "Beach access", "Spa", "Breakfast"],
    bookingSite: "Booking.com",
    bookingUrl: "https://www.booking.com/",
  },
  {
    hotelName: "Hyatt Place Goa Candolim",
    rating: 4.2,
    pricePerNight: 6850,
    amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant"],
    bookingSite: "Goibibo",
    bookingUrl: "https://www.goibibo.com/hotels/",
  },
  {
    hotelName: "Lemon Tree Amarante Beach Resort, Goa",
    rating: 4.1,
    pricePerNight: 7950,
    amenities: ["Free Wi-Fi", "Pool", "Spa", "Airport shuttle", "Bar"],
    bookingSite: "MakeMyTrip",
    bookingUrl: "https://www.makemytrip.com/hotels/",
  },
];

const preferences = {
  origin: "Nagpur",
  destination: "Goa",
  checkIn: "2026-10-15",
  checkOut: "2026-10-17",
  travelers: 2,
  budget: 50000,
  airlines: "any",
  directOnly: false,
  departureTime: "any",
  minRating: 3,
  amenities: [],
};

// ---------------------------------------------------------------------------
// Run — Milestone 3 → Milestone 4 chained
// ---------------------------------------------------------------------------

(async function main() {
  // --- Milestone 3: parse & filter raw results ---
  console.log("\n=== Milestone 3: parseSearchResults ===\n");
  let parsedData;
  try {
    parsedData = await parseSearchResults(mockFlights, mockHotels, preferences);
    console.log(JSON.stringify(parsedData, null, 2));
  } catch (err) {
    console.error("parseSearchResults error:", err);
    process.exitCode = 1;
    return;
  }

  // --- Milestone 4: evaluate & rank bundles ---
  console.log("\n=== Milestone 4: evaluateBundles ===\n");
  try {
    const bundles = await evaluateBundles(parsedData, preferences);
    if (bundles.length === 0) {
      console.log("No bundles fit within the budget.");
    } else {
      console.log(JSON.stringify(bundles, null, 2));
    }
  } catch (err) {
    console.error("evaluateBundles error:", err);
    process.exitCode = 1;
  }
})();
