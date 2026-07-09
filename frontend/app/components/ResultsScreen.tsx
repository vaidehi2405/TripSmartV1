"use client";

import { useTrip, SortOption } from "../context/TripContext";
import SearchSummaryBar from "./SearchSummaryBar";
import FiltersSidebar from "./FiltersSidebar";
import BundleCard from "./BundleCard";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "best", label: "Best Overall" },
  { value: "cheapest", label: "Cheapest" },
  { value: "bestHotel", label: "Best Hotel" },
  { value: "fastest", label: "Fastest" },
];

export default function ResultsScreen() {
  const {
    filteredBundles,
    bundles,
    sortBy,
    setSortBy,
    isLoading,
    error,
    goHome,
  } = useTrip();

  return (
    <div className="animate-fade-in">
      <SearchSummaryBar />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error && bundles.length === 0 ? (
          <ErrorState message={error} onRetry={goHome} />
        ) : (
          <div className="flex gap-6 items-start">
            {/* Filters */}
            <FiltersSidebar />

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">
                  {filteredBundles.length} Best Bundle
                  {filteredBundles.length !== 1 ? "s" : ""} Found
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    id="sort-dropdown"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bundle cards */}
              {filteredBundles.length > 0 ? (
                <div className="space-y-4">
                  {filteredBundles.map((bundle, displayIndex) => {
                    // Find the original index in the bundles array
                    const originalIndex = bundles.indexOf(bundle);
                    return (
                      <BundleCard
                        key={originalIndex}
                        bundle={bundle}
                        index={displayIndex}
                        originalIndex={originalIndex}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="card p-12 text-center">
                  <div className="text-4xl mb-3 opacity-50">🔍</div>
                  <p className="text-slate-500 text-sm">
                    No bundles match your current filters. Try adjusting the
                    filters.
                  </p>
                </div>
              )}

              {/* AI Insight card */}
              {filteredBundles.length > 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 animate-fade-in-up">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm">
                    🤖
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      AI Insight
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                      These bundles were selected based on your preferences and
                      budget. <strong>Best Overall</strong> gives you the perfect
                      balance of price, rating & convenience.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-6">
      <div className="w-72 flex-shrink-0">
        <div className="skeleton h-[500px] rounded-xl" />
      </div>
      <div className="flex-1 space-y-4">
        <div className="skeleton h-10 w-64 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-5xl mb-4">😕</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        No Bundles Found
      </h3>
      <p className="text-sm text-slate-500 max-w-md text-center mb-6">
        {message}
      </p>
      <button onClick={onRetry} className="btn-primary" id="retry-search">
        Try a New Search
      </button>
    </div>
  );
}
