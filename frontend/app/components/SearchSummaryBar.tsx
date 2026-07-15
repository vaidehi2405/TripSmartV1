"use client";

import { useTrip } from "../context/TripContext";
import { formatDate } from "../data/dummyData";

export default function SearchSummaryBar() {
  const { searchParams, goHome } = useTrip();
  const sp = searchParams;

  return (
    <div className="bg-white border-b border-slate-100 shadow-sm" id="search-summary-bar">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="font-semibold text-slate-800">
            {sp.from.split("(")[0].trim()}
          </span>
          <span className="text-slate-400">→</span>
          <span className="font-semibold text-slate-800">
            {sp.to.split("(")[0].trim()}
          </span>
          <span className="w-px h-4 bg-slate-200" />
          <span className="text-slate-500">
            {formatDate(sp.departureDate)} - {formatDate(sp.returnDate)}
          </span>
          <span className="w-px h-4 bg-slate-200" />
          <span className="text-slate-500">
            {sp.travelers} Adult{sp.travelers > 1 ? "s" : ""}
          </span>
          <span className="w-px h-4 bg-slate-200" />
          <span className="text-slate-500">
            Budget: ₹{sp.budget.toLocaleString("en-IN")}
          </span>
          {sp.hotelPreferenceText && (
            <>
              <span className="w-px h-4 bg-slate-200" />
              <span className="text-slate-500 truncate max-w-[200px]" title={sp.hotelPreferenceText}>
                AI: &ldquo;{sp.hotelPreferenceText}&rdquo;
              </span>
              <button
                onClick={() => {
                  goHome();
                  setTimeout(() => {
                    const el = document.getElementById("input-ai-preferences");
                    if (el) {
                      el.focus();
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }, 100);
                }}
                className="text-xs text-blue-600 hover:text-blue-750 underline font-semibold shrink-0 cursor-pointer"
              >
                Edit
              </button>
            </>
          )}
        </div>
        <button
          onClick={goHome}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
          id="edit-search-btn"
        >
          Edit Search
        </button>
      </div>
    </div>
  );
}
