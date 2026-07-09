"use client";

import { useTrip } from "../context/TripContext";

const departureTimeOptions = [
  { value: "morning", label: "Morning (5AM – 12PM)" },
  { value: "afternoon", label: "Afternoon (12PM – 6PM)" },
  { value: "evening", label: "Evening (6PM – 12AM)" },
];

const ratingOptions = [
  { value: 3, label: "3★ & above" },
  { value: 4, label: "4★ & above" },
  { value: 5, label: "5★ only" },
];

const amenityCheckboxes = ["Pool", "Free Wi-Fi", "Breakfast", "AC", "Spa", "Gym"];

export default function FiltersSidebar() {
  const { filters, setFilters, resetFilters, bundles, searchParams } = useTrip();

  // Extract unique airlines from results
  const airlines = Array.from(
    new Set(
      bundles
        .map((b) => b.flightDetails?.airline)
        .filter(Boolean)
    )
  ) as string[];

  const toggleAirline = (airline: string) => {
    const current = filters.airlines;
    if (current.includes(airline)) {
      setFilters({ airlines: current.filter((a) => a !== airline) });
    } else {
      setFilters({ airlines: [...current, airline] });
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities;
    if (current.includes(amenity)) {
      setFilters({ amenities: current.filter((a) => a !== amenity) });
    } else {
      setFilters({ amenities: [...current, amenity] });
    }
  };

  return (
    <aside
      className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-100 p-5 h-fit sticky top-24 animate-fade-in"
      id="filters-sidebar"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-800">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          id="clear-filters"
        >
          Clear all
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Price Range (Total)
        </h4>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-500">
            ₹{filters.priceMin.toLocaleString("en-IN")}
          </span>
          <span className="flex-1" />
          <span className="text-xs text-slate-500">
            ₹{filters.priceMax.toLocaleString("en-IN")}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={searchParams.budget || 100000}
          step={1000}
          value={filters.priceMax}
          onChange={(e) => setFilters({ priceMax: parseInt(e.target.value) })}
          className="w-full"
          id="filter-price"
        />
      </div>

      {/* Airlines */}
      {airlines.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Airlines
          </h4>
          <div className="space-y-2">
            {airlines.map((airline) => (
              <label
                key={airline}
                className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.airlines.includes(airline)}
                  onChange={() => toggleAirline(airline)}
                />
                <span>{airline}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Stops */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Stops
        </h4>
        <div className="space-y-2">
          {[
            { value: -1, label: "Any" },
            { value: 0, label: "Direct (0)" },
            { value: 1, label: "1 Stop (1)" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              <input
                type="radio"
                name="stops"
                checked={filters.maxStops === opt.value}
                onChange={() => setFilters({ maxStops: opt.value })}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Departure Time */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Departure Time
        </h4>
        <div className="space-y-2">
          {departureTimeOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.departureTime === opt.value}
                onChange={() =>
                  setFilters({
                    departureTime:
                      filters.departureTime === opt.value ? "any" : opt.value,
                  })
                }
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Hotel Rating */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Hotel Rating
        </h4>
        <div className="space-y-2">
          {ratingOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              <input
                type="radio"
                name="hotelRating"
                checked={filters.hotelRating === opt.value}
                onChange={() => setFilters({ hotelRating: opt.value })}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>{opt.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-800 transition-colors">
            <input
              type="radio"
              name="hotelRating"
              checked={filters.hotelRating === 0}
              onChange={() => setFilters({ hotelRating: 0 })}
              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span>Any</span>
          </label>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Amenities
        </h4>
        <div className="space-y-2">
          {amenityCheckboxes.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
