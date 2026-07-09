"use client";

import { useTrip } from "../context/TripContext";

export default function Header() {
  const { currentView, goHome } = useTrip();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo and Back button */}
        <div className="flex items-center gap-2">
          {currentView === "home" && (
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all flex items-center justify-center"
              id="header-back-button"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={goHome}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            id="header-logo"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg">
              ✈
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Trip<span className="text-blue-600">Smart</span>
            </span>
          </button>
        </div>

    

        
      </div>
    </header>
  );
}
