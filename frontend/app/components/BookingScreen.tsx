"use client";

import { useTrip } from "../context/TripContext";
import { calcNights, formatDate } from "../data/dummyData";

export default function BookingScreen() {
  const {
    selectedBundle: bundle,
    selectedBundleIndex,
    searchParams,
    goToBundle,
  } = useTrip();

  if (!bundle) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">No bundle selected.</p>
      </div>
    );
  }

  const flight = bundle.flightDetails || {};
  const hotel = bundle.hotelDetails || {};
  const nights = calcNights(searchParams.departureDate, searchParams.returnDate);
  const travelers = searchParams.travelers;

  const flightPrice = (flight.pricePerPerson ?? 0) * travelers * 2;
  const hotelPrice = (hotel.pricePerNight ?? 0) * nights;
  const totalPrice = bundle.totalCost ?? flightPrice + hotelPrice;
  const savings = Math.round(totalPrice * 0.12); // ~12% savings for bundle

  const stopsText =
    flight.stops === 0
      ? "Non-stop"
      : flight.stops === 1
      ? "1 stop"
      : `${flight.stops} stops`;

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <button
            onClick={() => goToBundle(selectedBundleIndex)}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            id="back-to-bundle-from-booking"
          >
            ← Back to Bundle
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold text-slate-800 text-center mb-2">
          You can book this bundle in multiple ways
        </h1>
        <p className="text-sm text-slate-400 text-center mb-10">
          Choose what works best for you
        </p>

        {/* Option 1: Full Bundle */}
        <div
          className="card-elevated rounded-2xl p-8 mb-8 border-2 border-blue-100 relative overflow-hidden"
          id="book-full-bundle"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Book Full Bundle
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-1">
                Book flight + hotel together and get the best price.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  You save ₹{savings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-slate-800">
                ₹{totalPrice.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Total for {travelers} Adult{travelers > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <button
            className="mt-6 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            id="book-full-bundle-btn"
          >
            Book Full Bundle
          </button>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm font-semibold text-slate-400">
            Or Book Separately
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Separate booking cards */}
        <div className="space-y-4 mb-10">
          {/* Flight */}
          <div className="card p-5" id="book-flight-separate">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-lg">✈️</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {flight.airline || "Airline"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {flight.departureTime} – {flight.arrivalTime} | {stopsText}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-800">
                    ₹{flightPrice.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    for {travelers} Adult{travelers > 1 ? "s" : ""}
                  </div>
                </div>
                <a
                  href={flight.bookingUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-book bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 whitespace-nowrap"
                  id="book-flight-separate-btn"
                >
                  Book on {flight.bookingSite || flight.airline || "Airline"}
                </a>
              </div>
            </div>
          </div>

          {/* Hotel */}
          <div className="card p-5" id="book-hotel-separate">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <span className="text-lg">🏨</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {hotel.name || "Hotel"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {formatDate(searchParams.departureDate)} –{" "}
                    {formatDate(searchParams.returnDate)} | {nights} Night
                    {nights > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-800">
                    ₹{hotelPrice.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    for {travelers} Adult{travelers > 1 ? "s" : ""}
                  </div>
                </div>
                <a
                  href={hotel.bookingUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-book bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400 whitespace-nowrap"
                  id="book-hotel-separate-btn"
                >
                  Book on {hotel.bookingSite || "MakeMyTrip"}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>Instant confirmation</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📞</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
