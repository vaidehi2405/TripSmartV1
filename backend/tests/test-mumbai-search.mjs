// Quick test: search for Mumbai bundles via the API
const preferences = {
  origin: "Nagpur",
  destination: "Mumbai",
  checkIn: "2026-10-15",
  checkOut: "2026-10-17",
  travelers: 2,
  budget: 50000,
  airlines: "any",
  directOnly: false,
  departureTime: "any",
  minRating: 3,
  amenities: [],
  hotelPreferenceText: "",
};

fetch("http://localhost:4000/api/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ preferences }),
})
  .then((r) => r.json())
  .then((data) => {
    const bundles = data.bundles || [];
    console.log(`\n=== ${bundles.length} bundle(s) returned ===\n`);
    for (const b of bundles) {
      console.log(
        `✈️  ${b.flightDetails?.airline} | ₹${b.flightDetails?.pricePerPerson}/pp`
      );
      console.log(
        `🏨  ${b.hotelDetails?.name} | ${b.hotelDetails?.rating}⭐ | ₹${b.hotelDetails?.pricePerNight}/night`
      );
      console.log(`💰  Total: ₹${b.totalCost} | Verdict: ${b.verdict}\n`);
    }
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exitCode = 1;
  });
