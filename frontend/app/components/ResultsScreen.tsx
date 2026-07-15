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
    <div className="animate-fade-in md:h-screen md:flex md:flex-col md:overflow-hidden">
      <div className="shrink-0 z-20 relative">
        <SearchSummaryBar />
      </div>

      <div className="flex-1 md:overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-6 md:h-full">
        {isLoading && bundles.length === 0 ? (
          <LoadingSkeleton />
        ) : error && bundles.length === 0 ? (
          <ErrorState message={error} onRetry={goHome} />
        ) : (
          <div className="flex flex-col md:flex-row gap-6 md:items-stretch md:h-full">
            {/* Filters */}
            <FiltersSidebar />

            {/* Results */}
            <div className="flex-1 min-w-0 md:h-full md:overflow-y-auto scrollbar-thin md:pr-4 pb-20 relative">
              {/* Results header */}
              <div className="flex items-center justify-between mb-5 sticky top-0 bg-[#F8FAFC] z-10 py-4 -mt-4">
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

              {/* No-full-match banner (Guardrail B) */}
              {!isLoading && filteredBundles.length > 0 && !filteredBundles.some((b) => b.preferenceMatch === "full") && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2 items-center">
                  <span>⚠</span>
                  <p className="font-medium">No bundle matches all your requirements. These are the closest available options.</p>
                </div>
              )}

              {/* Bundle cards */}
              {filteredBundles.length > 0 || isLoading ? (
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
                  {/* Streaming skeletons at the bottom of the cards list */}
                  {isLoading && (
                    <>
                      {[1, 2].map((i) => (
                        <div key={i} className="card p-5 border border-slate-100 bg-white flex flex-col md:flex-row animate-pulse gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="h-4 bg-slate-100 rounded w-24" />
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-slate-100" />
                              <div className="space-y-2 flex-1">
                                <div className="h-4 bg-slate-200 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 rounded w-1/4" />
                              </div>
                            </div>
                            <div className="flex items-center gap-4 border-t border-slate-50 pt-3">
                              <div className="w-20 h-14 rounded-lg bg-slate-100" />
                              <div className="space-y-2 flex-1">
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                                <div className="h-3 bg-slate-100 rounded w-1/3" />
                              </div>
                            </div>
                          </div>
                          <div className="md:w-48 border-t md:border-t-0 md:border-l border-slate-100 p-5 flex flex-col items-end justify-center bg-slate-50/50 gap-2">
                            <div className="h-6 bg-slate-200 rounded w-24" />
                            <div className="h-3 bg-slate-100 rounded w-16" />
                            <div className="h-8 bg-slate-100 rounded w-28 mt-2" />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="card p-12 text-center">
                  <div className="text-4xl mb-3 opacity-50">🔍</div>
                  <p className="text-slate-500 text-sm">
                    No bundles match your current filters. Clear filters or edit the search to fetch a wider set of recommendations.
                  </p>
                </div>
              )}

              {/* AI Insight card (Guardrail E — calibrated language) */}
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
                      Best available options based on current results. These recommendations depend on the available listing data. Use &ldquo;Why TripSmart recommends this&rdquo; on each card to see how your preferences were evaluated.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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
