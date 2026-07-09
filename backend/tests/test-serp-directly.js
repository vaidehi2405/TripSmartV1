const { getJson } = require("serpapi");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

console.log("Key:", process.env.SERPAPI_KEY);

getJson({
  engine: "google_flights",
  api_key: process.env.SERPAPI_KEY,
  departure_id: "NAG",
  arrival_id: "GOI",
  outbound_date: "2026-10-15",
  type: "2",
  adults: "1",
  currency: "INR",
}).then(json => {
  console.log("Success! Results keys:", Object.keys(json));
}).catch(err => {
  console.error("Error:", err);
});
