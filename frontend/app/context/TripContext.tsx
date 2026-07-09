"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  defaultSearchParams,
  SearchParams,
  getDefaultDates,
  extractCityName,
} from "../data/dummyData";

// ---------- Types ----------

export type ViewName =
  | "home"
  | "results"
  | "bundle-details"
  | "booking-options";

export type SortOption = "best" | "cheapest" | "bestHotel" | "fastest";

export interface Filters {
  priceMin: number;
  priceMax: number;
  airlines: string[];
  maxStops: number; // -1 = any, 0 = direct, 1 = 1 stop
  departureTime: string; // "any" | "morning" | "afternoon" | "evening"
  hotelRating: number; // 0 = any
  amenities: string[];
}

export interface TripState {
  currentView: ViewName;
  searchParams: SearchParams;
  bundles: any[];
  selectedBundleIndex: number;
  isLoading: boolean;
  filters: Filters;
  sortBy: SortOption;
  error: string | null;
}

interface TripContextType extends TripState {
  setSearchParams: (params: Partial<SearchParams>) => void;
  performSearch: () => Promise<void>;
  goHome: () => void;
  goToResults: () => void;
  goToBundle: (index: number) => void;
  goToBooking: () => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  selectedBundle: any | null;
  filteredBundles: any[];
}

// ---------- Defaults ----------

const defaultDates = getDefaultDates();

const defaultFilters: Filters = {
  priceMin: 0,
  priceMax: 100000,
  airlines: [],
  maxStops: -1,
  departureTime: "any",
  hotelRating: 0,
  amenities: [],
};

const initialState: TripState = {
  currentView: "home",
  searchParams: {
    ...defaultSearchParams,
    departureDate: defaultDates.departure,
    returnDate: defaultDates.returnDate,
  },
  bundles: [],
  selectedBundleIndex: 0,
  isLoading: false,
  filters: defaultFilters,
  sortBy: "best",
  error: null,
};

// ---------- Context ----------

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TripState>(initialState);

  const setSearchParams = useCallback((params: Partial<SearchParams>) => {
    setState((prev) => {
      const nextParams = { ...prev.searchParams, ...params };
      if ("adults" in params || "children" in params) {
        nextParams.travelers = (nextParams.adults || 2) + (nextParams.children || 0);
      }
      if ("fromAirport" in params) {
        nextParams.from = nextParams.fromAirport;
      }
      if ("toAirport" in params) {
        nextParams.to = nextParams.toAirport;
      }
      return {
        ...prev,
        searchParams: nextParams,
      };
    });
  }, []);

  const performSearch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const sp = state.searchParams;
      const preferences = {
        origin: extractCityName(sp.fromAirport || sp.from),
        destination: extractCityName(sp.toAirport || sp.to),
        checkIn: sp.departureDate,
        checkOut: sp.returnDate,
        travelers: (sp.adults || 2) + (sp.children || 0),
        budget: sp.budget,
        airlines: sp.airlines,
        directOnly: sp.directOnly,
        departureTime: sp.departureTime,
        minRating: sp.minRating,
        amenities: sp.amenities,
        hotelPreferenceText: sp.hotelPreferenceText || "",
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      const data = await res.json();

      if (data.bundles && data.bundles.length > 0) {
        // Save to recent searches
        try {
          const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
          const newSearch = {
            from: sp.fromAirport || sp.from,
            to: sp.toAirport || sp.to,
            fromAirport: sp.fromAirport || sp.from,
            toAirport: sp.toAirport || sp.to,
            departureDate: sp.departureDate,
            returnDate: sp.returnDate,
            travelers: (sp.adults || 2) + (sp.children || 0),
            adults: sp.adults || 2,
            children: sp.children || 0,
            timestamp: Date.now(),
          };
          const updated = [newSearch, ...recent.filter((r: any) =>
            (r.fromAirport || r.from) !== (sp.fromAirport || sp.from) || (r.toAirport || r.to) !== (sp.toAirport || sp.to)
          )].slice(0, 5);
          localStorage.setItem("recentSearches", JSON.stringify(updated));
        } catch { }

        setState((prev) => ({
          ...prev,
          bundles: data.bundles,
          isLoading: false,
          currentView: "results",
          filters: {
            ...prev.filters,
            priceMax: sp.budget || 100000,
          },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          bundles: [],
          isLoading: false,
          error: "No bundles found within your budget. Try adjusting your preferences.",
          currentView: "results",
        }));
      }
    } catch (err) {
      console.error("Search failed:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Something went wrong. Please try again.",
        currentView: "results",
      }));
    }
  }, [state.searchParams]);

  const goHome = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: "home" }));
    window.scrollTo(0, 0);
  }, []);

  const goToResults = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: "results" }));
    window.scrollTo(0, 0);
  }, []);

  const goToBundle = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentView: "bundle-details",
      selectedBundleIndex: index,
    }));
    window.scrollTo(0, 0);
  }, []);


  const goToBooking = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: "booking-options" }));
    window.scrollTo(0, 0);
  }, []);

  const setFilters = useCallback((filters: Partial<Filters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: defaultFilters }));
  }, []);

  const setSortBy = useCallback((sort: SortOption) => {
    setState((prev) => ({ ...prev, sortBy: sort }));
  }, []);

  // Derived: selected bundle
  const selectedBundle =
    state.bundles.length > state.selectedBundleIndex
      ? state.bundles[state.selectedBundleIndex]
      : null;

  // Derived: filtered and sorted bundles
  const filteredBundles = React.useMemo(() => {
    let result = [...state.bundles];

    const f = state.filters;

    // Price filter
    result = result.filter((b) => {
      const cost = b.totalCost ?? 0;
      return cost >= f.priceMin && cost <= f.priceMax;
    });

    // Airline filter
    if (f.airlines.length > 0) {
      result = result.filter((b) =>
        f.airlines.some(
          (a) =>
            b.flightDetails?.airline?.toLowerCase().includes(a.toLowerCase())
        )
      );
    }

    // Stops filter
    if (f.maxStops >= 0) {
      result = result.filter(
        (b) => (b.flightDetails?.stops ?? 0) <= f.maxStops
      );
    }

    // Hotel rating filter
    if (f.hotelRating > 0) {
      result = result.filter(
        (b) => (b.hotelDetails?.rating ?? 0) >= f.hotelRating
      );
    }

    // Departure Time filter
    if (f.departureTime && f.departureTime !== "any") {
      result = result.filter((b) => {
        const depTime = b.flightDetails?.departureTime;
        if (!depTime) return false;
        const hour = parseInt(depTime.split(":")[0], 10);
        if (isNaN(hour)) return false;
        if (f.departureTime === "morning") {
          return hour >= 5 && hour < 12;
        } else if (f.departureTime === "afternoon") {
          return hour >= 12 && hour < 17;
        } else if (f.departureTime === "evening") {
          return hour >= 17 || hour < 5;
        }
        return true;
      });
    }

    // Amenities filter
    if (f.amenities && f.amenities.length > 0) {
      result = result.filter((b) => {
        const hotelAmenities = b.hotelDetails?.amenities || [];
        return f.amenities.every((amenity) =>
          hotelAmenities.some((hAmenity: string) =>
            hAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
      });
    }

    // Sort
    switch (state.sortBy) {
      case "cheapest":
        result.sort((a, b) => (a.totalCost ?? 0) - (b.totalCost ?? 0));
        break;
      case "bestHotel":
        result.sort(
          (a, b) =>
            (b.hotelDetails?.rating ?? 0) - (a.hotelDetails?.rating ?? 0)
        );
        break;
      case "fastest":
        result.sort(
          (a, b) =>
            (a.flightDetails?.duration ?? 999) -
            (b.flightDetails?.duration ?? 999)
        );
        break;
      case "best":
      default:
        // Keep original AI ranking
        break;
    }

    return result;
  }, [state.bundles, state.filters, state.sortBy]);

  return (
    <TripContext.Provider
      value={{
        ...state,
        setSearchParams,
        performSearch,
        goHome,
        goToResults,
        goToBundle,
        goToBooking,
        setFilters,
        resetFilters,
        setSortBy,
        selectedBundle,
        filteredBundles,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
}
