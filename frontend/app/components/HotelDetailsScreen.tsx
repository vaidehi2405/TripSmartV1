"use client";

import { useTrip } from "../context/TripContext";
import { formatDateLong, calcNights } from "../data/dummyData";

const amenityIcons: Record<string, string> = {
  Pool: "🏊",
  "Free Wi-Fi": "📶",
  Breakfast: "🍳",
  AC: "❄️",
  Spa: "💆",
  Gym: "🏋️",
  Parking: "🅿️",
  Restaurant: "🍽",
  Bar: "🍸",
  "Airport shuttle": "🚐",
  TV: "📺",
  "24-hour front desk": "🏢",
  "Room service": "🛎",
  "Beach access": "🏖",
};

export default function HotelDetailsScreen() {
  const { selectedBundle: bundle, searchParams, goToBundle, selectedBundleIndex } = useTrip();

  if (!bundle) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">No hotel selected.</p>
      </div>
    );
  }

  const hotel = bundle.hotelDetails || {};
  const nights = calcNights(searchParams.departureDate, searchParams.returnDate);

  const amenities = hotel.amenities || [];

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <button
            onClick={() => goToBundle(selectedBundleIndex)}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            id="back-to-bundle"
          >
            ← Back to Bundle
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hotel name + rating */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">
            {hotel.name || "Hotel"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 bg-green-600 text-white px-2.5 py-1 rounded-md text-xs font-bold">
              ★ {hotel.rating || "—"}
            </span>
            <span className="text-sm text-slate-500">· Very Good</span>
            <span className="text-sm text-slate-400">· 234 reviews</span>
          </div>
        </div>

        {/* Image gallery */}
        <div className="grid grid-cols-4 gap-3 mb-8" id="hotel-gallery">
          <div className="col-span-2 row-span-2 rounded-xl bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center h-64 overflow-hidden">
            <span className="text-6xl">🏨</span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center h-[122px]">
            <span className="text-3xl">🏊</span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center h-[122px]">
            <span className="text-3xl">🍽</span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center h-[122px]">
            <span className="text-3xl">🛏</span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center h-[122px] relative cursor-pointer group">
            <span className="text-3xl">📸</span>
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">
                View all photos
              </span>
            </div>
          </div>
        </div>

        {/* Amenities icons */}
        <section className="mb-8">
          <h2 className="section-heading mb-4">Amenities</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {amenities.slice(0, 6).map((a: string, i: number) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="text-2xl">
                  {amenityIcons[a] || "✨"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium text-center">
                  {a}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* About the hotel */}
        <section className="mb-8">
          <h2 className="section-heading mb-3">About the Hotel</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Overlooking the beautiful landscape, this property offers a perfect blend of
            luxury and comfort. Located in the heart of{" "}
            {searchParams.to.split("(")[0].trim()}, the hotel is well-connected to major
            attractions and offers world-class amenities for both business and leisure
            travelers.
          </p>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 transition-colors">
            View more
          </button>
        </section>

        {/* Location placeholder */}
        <section className="mb-8">
          <h2 className="section-heading mb-3">Location</h2>
          <div className="w-full h-48 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <div className="text-center">
              <span className="text-3xl block mb-2">📍</span>
              <span className="text-sm text-slate-400">Map View</span>
              <button className="block mx-auto mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                View on Map
              </button>
            </div>
          </div>
        </section>

        {/* Check-in/out + Cancellation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Check-in
            </h3>
            <div className="text-sm font-semibold text-slate-800">
              {formatDateLong(searchParams.departureDate)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">2:00 PM</div>
          </div>
          <div className="card p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Check-out
            </h3>
            <div className="text-sm font-semibold text-slate-800">
              {formatDateLong(searchParams.returnDate)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">11:00 AM</div>
          </div>
          <div className="card p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Cancellation Policy
            </h3>
            <div className="text-sm font-semibold text-green-600">
              Free cancellation
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              till{" "}
              {(() => {
                const d = new Date(searchParams.departureDate);
                d.setDate(d.getDate() - 3);
                return formatDateLong(d.toISOString().split("T")[0]);
              })()}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href={hotel.bookingUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400 inline-block px-10 py-3.5 text-base"
            id="book-hotel-detail-btn"
          >
            Book on {hotel.bookingSite || "MakeMyTrip"} →
          </a>
        </div>
      </div>
    </div>
  );
}
