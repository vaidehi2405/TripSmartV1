"use client";

import { useTrip } from "../context/TripContext";
import { formatDateLong, calcNights } from "../data/dummyData";

const badgeLabels = ["Best Overall", "Cheapest", "Best Hotel"];
const badgeClasses = ["badge-best", "badge-cheapest", "badge-hotel"];

export default function BundleDetailsScreen() {
  const {
    selectedBundle: bundle,
    selectedBundleIndex,
    goToResults,
    goToBooking,
    searchParams,
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
  const stopsText =
    flight.stops === 0
      ? "Non-stop"
      : flight.stops === 1
      ? "1 stop"
      : `${flight.stops} stops`;

  const fromCode =
    searchParams.from.match(/\(([^)]+)\)/)?.[1] || searchParams.from;
  const toCode =
    searchParams.to.match(/\(([^)]+)\)/)?.[1] || searchParams.to;

  // Price breakdown
  const flightPrice = (flight.pricePerPerson ?? 0) * travelers * 2;
  const hotelPrice = (hotel.pricePerNight ?? 0) * nights;
  const taxesFees = Math.round(bundle.totalCost * 0.03);
  const displayTotal = bundle.totalCost ?? flightPrice + hotelPrice + taxesFees;

  // Why AI recommended
  const backendReasons = Array.isArray(bundle.recommendationReasons)
    ? bundle.recommendationReasons
    : [];
  const aiMatches = Array.isArray(bundle.aiPreferenceMatches)
    ? bundle.aiPreferenceMatches
    : [];
  const missedPreferences = Array.isArray(bundle.preferencesMissed)
    ? bundle.preferencesMissed
    : [];
  const reasons = [...aiMatches, ...backendReasons];
  if (reasons.length === 0) {
    if (bundle.budgetRemaining >= 0) reasons.push("Fits within your budget of ₹" + searchParams.budget.toLocaleString("en-IN"));
    if (searchParams.departureTime !== "any") reasons.push(searchParams.departureTime.charAt(0).toUpperCase() + searchParams.departureTime.slice(1) + " departure as preferred");
    if (flight.stops === 0) reasons.push("Direct flight for a comfortable journey");
    if ((hotel.rating ?? 0) >= 4) reasons.push(hotel.rating + "★ hotel with good ratings/amenities");
    reasons.push("Best value combination of price, rating & convenience");
  }

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={goToResults}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            id="back-to-results"
          >
            ← Back to Results
          </button>
          <button className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Share ↗
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Badge + Price header */}
        <div className="flex items-start justify-between mb-8">
          <span
            className={`badge ${
              badgeClasses[selectedBundleIndex] || "badge-best"
            }`}
          >
            {badgeLabels[selectedBundleIndex] || "Top Pick"}
          </span>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-slate-800">
              ₹{displayTotal.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-400">Includes taxes & fees</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Flight Details Card */}
          <div className="card p-6" id="flight-details-card">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Flight Details
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <span className="text-lg">✈️</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {flight.airline || "Airline"}
                </div>
                <div className="text-xs text-slate-400">Economy</div>
              </div>
            </div>

            {/* Time display */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {flight.departureTime || "--:--"}
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {fromCode}
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatDateLong(searchParams.departureDate)}
                </div>
              </div>

              <div className="flex-1 mx-6 flex flex-col items-center">
                <div className="text-[10px] text-slate-400">
                  {flight.duration
                    ? `${Math.floor(flight.duration / 60)}h ${
                        flight.duration % 60
                      }m`
                    : "—"}
                </div>
                <div className="w-full h-px bg-slate-200 relative my-1.5">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300" />
                </div>
                <div className="text-[10px] text-slate-400">{stopsText}</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {flight.arrivalTime || "--:--"}
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {toCode}
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatDateLong(searchParams.departureDate)}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-5 border-t border-slate-50 pt-3">
              <span className="flex items-center gap-1">🧳 7kg Cabin Baggage</span>
              <span className="flex items-center gap-1">📦 15kg Check-in Baggage</span>
              <span className="flex items-center gap-1">🍽 Free Meal</span>
            </div>

            {/* CTA */}
            <a
              href={flight.bookingUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 w-full text-center block"
              id="book-flight-btn"
            >
              Book on {flight.bookingSite || flight.airline || "Airline"} →
            </a>
          </div>

          {/* Hotel Details Card */}
          <div className="card p-6" id="hotel-details-card">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Hotel Details
            </h3>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-base font-bold text-slate-800">
                  {hotel.name || "Hotel"}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-amber-500 font-bold">
                    ★ {hotel.rating || "—"}
                  </span>
                  <span className="text-xs text-slate-400">· Very Good</span>
                </div>
              </div>
            </div>
 
             {/* Hotel image */}
             <div className="w-full h-48 rounded-xl bg-slate-100 overflow-hidden mb-4 border border-slate-100">
               {hotel.image ? (
                 <img
                   src={hotel.image}
                   alt={hotel.name || "Hotel"}
                   className="w-full h-full object-cover animate-fade-in"
                 />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                   <span className="text-4xl">🏨</span>
                 </div>
               )}
             </div>

            {/* Check-in/out */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Check-in
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {formatDateLong(searchParams.departureDate)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Check-out
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {formatDateLong(searchParams.returnDate)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Duration
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {nights} Night{nights > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(hotel.amenities || []).slice(0, 5).map((a: string, i: number) => (
                <span
                  key={i}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 font-medium border border-slate-100"
                >
                  {a}
                </span>
              ))}
            </div>

            {/* CTA */}
            <a
              href={hotel.bookingUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400 w-full text-center block"
              id="book-hotel-btn"
            >
              Book on {hotel.bookingSite || "MakeMyTrip"} →
            </a>
          </div>
        </div>

        {/* Price Breakdown + Why AI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Price Breakdown */}
          <div className="card p-6" id="price-breakdown">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Price Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Flight ({travelers} Adult{travelers > 1 ? "s" : ""})
                </span>
                <span className="font-semibold text-slate-800">
                  ₹{flightPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Hotel ({nights} Night{nights > 1 ? "s" : ""})
                </span>
                <span className="font-semibold text-slate-800">
                  ₹{hotelPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Taxes & Fees</span>
                <span className="font-semibold text-slate-800">
                  ₹{taxesFees.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-extrabold text-lg text-slate-800">
                  ₹{displayTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Why AI Recommended */}
          <div className="card p-6" id="ai-recommendation">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Why AI Recommended This
            </h3>
            <div className="space-y-2.5">
              {reasons.map((reason, i) => (
                <div key={i} className="text-sm text-slate-600 leading-relaxed">
                  ✅ {reason}
                </div>
              ))}
              {missedPreferences.map((reason: string, i: number) => (
                <div key={`missed-${i}`} className="text-sm text-amber-600 leading-relaxed">
                  ⚠️ {reason}
                </div>
              ))}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
