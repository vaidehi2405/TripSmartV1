"use client";

import { TripProvider, useTrip } from "./context/TripContext";
import Header from "./components/Header";
import HomeScreen from "./components/HomeScreen";
import ResultsScreen from "./components/ResultsScreen";
import BundleDetailsScreen from "./components/BundleDetailsScreen";
import BookingScreen from "./components/BookingScreen";

function AppContent() {
  const { currentView, isLoading } = useTrip();

  // Loading overlay for search
  const showLoadingOverlay = isLoading && currentView === "home";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      {/* Loading overlay */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-lg font-semibold text-slate-700">
            Finding best bundles...
          </p>
          <p className="text-sm text-slate-400 mt-1">
            AI is analyzing flights & hotels for you
          </p>
        </div>
      )}

      {/* View router */}
      {currentView === "home" && <HomeScreen />}
      {currentView === "results" && <ResultsScreen />}
      {currentView === "bundle-details" && <BundleDetailsScreen />}
      {currentView === "booking-options" && <BookingScreen />}
    </div>
  );
}

export default function Home() {
  return (
    <TripProvider>
      <AppContent />
    </TripProvider>
  );
}
