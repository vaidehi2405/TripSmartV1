function explainEmptySearch({ rawFlights, rawHotels, parsedData, preferences }) {
  const budget = Number(preferences.budget) || 0;
  const destination = preferences.destinationCity || preferences.destination || "your destination";

  if (rawFlights.length === 0) {
    return {
      reason: "no_flights",
      message:
        `No flights found from ${preferences.origin || "your origin"} to ${destination}. ` +
        "Try different dates or relax your flight filters.",
    };
  }

  if (rawHotels.length === 0) {
    return {
      reason: "no_hotels",
      message:
        `No hotels found in ${destination}. ` +
        "Try lowering the minimum rating or removing amenity filters.",
    };
  }

  if (parsedData.flights.length === 0) {
    return {
      reason: "no_matching_flights",
      message:
        "Flights were found, but none matched your preferences " +
        "(direct only, airline, or departure time). Try relaxing those filters.",
    };
  }

  if (parsedData.hotels.length === 0) {
    return {
      reason: "no_matching_hotels",
      message:
        "Hotels were found, but none matched your rating or amenity preferences. " +
        "Try lowering the minimum rating or removing some amenities.",
    };
  }

  return {
    reason: "over_budget",
    message:
      `Bundles were found, but all exceed your budget of ₹${budget.toLocaleString("en-IN")}. ` +
      "Try increasing your budget or shortening your stay.",
  };
}

module.exports = { explainEmptySearch };
