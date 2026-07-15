"use client";

import { useState, useEffect } from "react";
import { useTrip } from "../context/TripContext";
import { popularDestinations, formatDate, SearchParams } from "../data/dummyData";
import { loadAirports, AirportRecord } from "../utils/airports";


export default function HomeScreen() {
  const { searchParams, setSearchParams, performSearch, isLoading } = useTrip();
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [airportList, setAirportList] = useState<AirportRecord[]>([]);
  const [fuseInstance, setFuseInstance] = useState<any>(null);

  // Autocomplete search state
  const sp = searchParams;
  const [fromSearch, setFromSearch] = useState(sp.fromAirport || "");
  const [toSearch, setToSearch] = useState(sp.toAirport || "");
  
  const [fromAirportObj, setFromAirportObj] = useState<any>(null);
  const [toAirportObj, setToAirportObj] = useState<any>(null);
  const [activeFromIndex, setActiveFromIndex] = useState<number>(-1);
  const [activeToIndex, setActiveToIndex] = useState<number>(-1);

  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      setRecentSearches(saved);
    } catch {}
  }, []);

  // Fetch complete global airports list and initialize Fuse.js
  useEffect(() => {
    loadAirports().then((list) => {
      setAirportList(list);
      import("fuse.js").then((FuseModule) => {
        const Fuse = FuseModule.default || FuseModule;
        const fuse = new Fuse(list, {
          keys: ["city", "name", "iata", "icao", "country"],
          threshold: 0.3,
          minMatchCharLength: 1,
        });
        setFuseInstance(fuse);
      });
    });
  }, []);

  // Pre-populate airport objects on load once list is ready
  useEffect(() => {
    if (airportList.length === 0) return;
    const fromObj = airportList.find(a => `${a.city} (${a.iata})` === sp.fromAirport);
    const toObj = airportList.find(a => `${a.city} (${a.iata})` === sp.toAirport);
    if (fromObj) setFromAirportObj(fromObj);
    if (toObj) setToAirportObj(toObj);
  }, [sp.fromAirport, sp.toAirport, airportList]);

  // Sync inputs with state when state changes
  useEffect(() => {
    setFromSearch(sp.fromAirport || "");
  }, [sp.fromAirport]);

  useEffect(() => {
    setToSearch(sp.toAirport || "");
  }, [sp.toAirport]);

  // Click outside detection for dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const fromInput = document.getElementById("input-from");
      const fromDropdown = document.getElementById("from-dropdown-container");
      const toInput = document.getElementById("input-to");
      const toDropdown = document.getElementById("to-dropdown-container");

      if (
        showFromDropdown &&
        fromInput &&
        fromDropdown &&
        !fromInput.contains(e.target as Node) &&
        !fromDropdown.contains(e.target as Node)
      ) {
        setShowFromDropdown(false);
        setActiveFromIndex(-1);
      }

      if (
        showToDropdown &&
        toInput &&
        toDropdown &&
        !toInput.contains(e.target as Node) &&
        !toDropdown.contains(e.target as Node)
      ) {
        setShowToDropdown(false);
        setActiveToIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showFromDropdown, showToDropdown]);

  const update = (partial: Partial<SearchParams>) => setSearchParams(partial);


  const handleSearch = () => {
    if (!sp.fromAirport || !sp.toAirport || !sp.departureDate || !sp.returnDate) return;
    performSearch();
  };

  const fillFromDestination = (dest: { name: string; code: string }) => {
    const val = `${dest.name} (${dest.code})`;
    setToSearch(val);
    update({ toAirport: val });
  };

  const fillFromRecent = (search: any) => {
    update({
      fromAirport: search.fromAirport || search.from,
      toAirport: search.toAirport || search.to,
      departureDate: search.departureDate,
      returnDate: search.returnDate,
      adults: search.adults || 2,
      children: search.children || 0,
    });
    setFromSearch(search.fromAirport || search.from);
    setToSearch(search.toAirport || search.to);
  };

  const selectFromAirport = (airport: any) => {
    const value = `${airport.city} (${airport.iata})`;
    setFromSearch(value);
    setFromAirportObj(airport);
    update({ fromAirport: value });
    setShowFromDropdown(false);
    setActiveFromIndex(-1);
  };

  const selectToAirport = (airport: any) => {
    const value = `${airport.city} (${airport.iata})`;
    setToSearch(value);
    setToAirportObj(airport);
    update({ toAirport: value });
    setShowToDropdown(false);
    setActiveToIndex(-1);
  };

  const getGroupedAirports = (query: string, type: "from" | "to") => {
    const selectedVal = type === "from" ? sp.fromAirport : sp.toAirport;
    const isQueryEmpty = query.trim() === "" || query === selectedVal;

    let recentList: any[] = [];
    try {
      const savedSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const seenCodes = new Set<string>();
      savedSearches.forEach((s: any) => {
        const fromCode = s.fromAirport?.match(/\(([^)]+)\)/)?.[1] || s.from?.match(/\(([^)]+)\)/)?.[1];
        const toCode = s.toAirport?.match(/\(([^)]+)\)/)?.[1] || s.to?.match(/\(([^)]+)\)/)?.[1];
        [fromCode, toCode].forEach(c => {
          if (c) {
            const found = airportList.find(a => a.iata.toUpperCase() === c.toUpperCase());
            if (found && !seenCodes.has(found.iata)) {
              seenCodes.add(found.iata);
              recentList.push(found);
            }
          }
        });
      });
    } catch {}

    const popularCodes = ["BOM", "GOI", "DEL", "LHR", "JFK", "SIN"];
    const popularList = airportList.filter(a => popularCodes.includes(a.iata.toUpperCase()));

    if (isQueryEmpty) {
      return {
        recent: recentList,
        popular: popularList,
        all: airportList.slice(0, 100),
        isQueryEmpty: true
      };
    } else {
      let filtered: AirportRecord[] = [];
      if (fuseInstance) {
        const searchResults = fuseInstance.search(query);
        filtered = searchResults.map((r: any) => r.item);
      } else {
        const q = query.toLowerCase();
        filtered = airportList.filter(
          (a) =>
            a.city.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.iata.toLowerCase().includes(q) ||
            a.icao.toLowerCase().includes(q) ||
            a.country.toLowerCase().includes(q)
        );
      }
      return {
        recent: [],
        popular: [],
        all: filtered.slice(0, 100),
        isQueryEmpty: false
      };
    }
  };

  const fromGroups = getGroupedAirports(fromSearch, "from");
  const fromFlatList: any[] = [];
  if (fromGroups.isQueryEmpty) {
    fromGroups.recent.forEach(a => fromFlatList.push({ ...a, section: "recent" }));
    fromGroups.popular.forEach(a => fromFlatList.push({ ...a, section: "popular" }));
    fromGroups.all.forEach(a => fromFlatList.push({ ...a, section: "all" }));
  } else {
    fromGroups.all.forEach(a => fromFlatList.push({ ...a, section: "filtered" }));
  }

  const toGroups = getGroupedAirports(toSearch, "to");
  const toFlatList: any[] = [];
  if (toGroups.isQueryEmpty) {
    toGroups.recent.forEach(a => toFlatList.push({ ...a, section: "recent" }));
    toGroups.popular.forEach(a => toFlatList.push({ ...a, section: "popular" }));
    toGroups.all.forEach(a => toFlatList.push({ ...a, section: "all" }));
  } else {
    toGroups.all.forEach(a => toFlatList.push({ ...a, section: "filtered" }));
  }

  const handleFromKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showFromDropdown) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        setShowFromDropdown(true);
        setActiveFromIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveFromIndex((prev) => {
        const next = prev + 1 >= fromFlatList.length ? 0 : prev + 1;
        setTimeout(() => {
          const el = document.getElementById(`from-opt-${next}`);
          el?.scrollIntoView({ block: "nearest" });
        }, 10);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveFromIndex((prev) => {
        const next = prev - 1 < 0 ? fromFlatList.length - 1 : prev - 1;
        setTimeout(() => {
          const el = document.getElementById(`from-opt-${next}`);
          el?.scrollIntoView({ block: "nearest" });
        }, 10);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeFromIndex >= 0 && activeFromIndex < fromFlatList.length) {
        selectFromAirport(fromFlatList[activeFromIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowFromDropdown(false);
      setActiveFromIndex(-1);
    }
  };

  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showToDropdown) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        setShowToDropdown(true);
        setActiveToIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveToIndex((prev) => {
        const next = prev + 1 >= toFlatList.length ? 0 : prev + 1;
        setTimeout(() => {
          const el = document.getElementById(`to-opt-${next}`);
          el?.scrollIntoView({ block: "nearest" });
        }, 10);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveToIndex((prev) => {
        const next = prev - 1 < 0 ? toFlatList.length - 1 : prev - 1;
        setTimeout(() => {
          const el = document.getElementById(`to-opt-${next}`);
          el?.scrollIntoView({ block: "nearest" });
        }, 10);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeToIndex >= 0 && activeToIndex < toFlatList.length) {
        selectToAirport(toFlatList[activeToIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowToDropdown(false);
      setActiveToIndex(-1);
    }
  };

  const renderAirportOption = (
    a: any,
    idx: number,
    type: "from" | "to",
    onSelect: (airport: any) => void,
    activeIndex: number
  ) => {
    const isSelected = activeIndex === idx;
    return (
      <button
        key={`${a.iata}-${idx}`}
        id={`${type}-opt-${idx}`}
        onClick={() => onSelect(a)}
        onMouseEnter={() => {
          if (type === "from") setActiveFromIndex(idx);
          else setActiveToIndex(idx);
        }}
        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between mt-0.5 border border-transparent ${
          isSelected
            ? "bg-blue-50 text-blue-900 font-bold border-blue-100"
            : "hover:bg-slate-50/70"
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="text-xs font-semibold text-slate-800 truncate">
            {a.city} — {a.name} ({a.iata}), {a.country}
          </div>
          {a.icao && (
            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
              ICAO: {a.icao}
            </div>
          )}
        </div>
        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0">
          {a.iata}
        </div>
      </button>
    );
  };

  const renderFromDropdown = () => {
    if (!showFromDropdown) return null;

    let itemCounter = 0;

    return (
      <>
        <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-20 max-h-80 overflow-y-auto overflow-x-hidden p-2" id="from-dropdown-container">
          {fromFlatList.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-450 font-medium">No matching airports</div>
          ) : (
            <>
              {/* Recent Section */}
              {fromGroups.isQueryEmpty && fromGroups.recent.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Recent Searches
                  </div>
                  {fromGroups.recent.map((a) => {
                    const idx = itemCounter++;
                    return renderAirportOption(a, idx, "from", selectFromAirport, activeFromIndex);
                  })}
                </div>
              )}

              {/* Popular Section */}
              {fromGroups.isQueryEmpty && fromGroups.popular.length > 0 && (
                <div className="mt-2 border-t border-slate-100/50 pt-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Popular Airports
                  </div>
                  {fromGroups.popular.map((a) => {
                    const idx = itemCounter++;
                    return renderAirportOption(a, idx, "from", selectFromAirport, activeFromIndex);
                  })}
                </div>
              )}

              {/* All / Filtered Section */}
              <div className={fromGroups.isQueryEmpty ? "mt-2 border-t border-slate-100/50 pt-2" : ""}>
                {fromGroups.isQueryEmpty && (
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    All Airports
                  </div>
                )}
                {fromGroups.all.map((a) => {
                  const idx = itemCounter++;
                  return renderAirportOption(a, idx, "from", selectFromAirport, activeFromIndex);
                })}
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  const renderToDropdown = () => {
    if (!showToDropdown) return null;

    let itemCounter = 0;

    return (
      <>
        <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-20 max-h-80 overflow-y-auto overflow-x-hidden p-2" id="to-dropdown-container">
          {toFlatList.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-450 font-medium">No matching airports</div>
          ) : (
            <>
              {/* Recent Section */}
              {toGroups.isQueryEmpty && toGroups.recent.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Recent Searches
                  </div>
                  {toGroups.recent.map((a) => {
                    const idx = itemCounter++;
                    return renderAirportOption(a, idx, "to", selectToAirport, activeToIndex);
                  })}
                </div>
              )}

              {/* Popular Section */}
              {toGroups.isQueryEmpty && toGroups.popular.length > 0 && (
                <div className="mt-2 border-t border-slate-100/50 pt-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Popular Airports
                  </div>
                  {toGroups.popular.map((a) => {
                    const idx = itemCounter++;
                    return renderAirportOption(a, idx, "to", selectToAirport, activeToIndex);
                  })}
                </div>
              )}

              {/* All / Filtered Section */}
              <div className={toGroups.isQueryEmpty ? "mt-2 border-t border-slate-100/50 pt-2" : ""}>
                {toGroups.isQueryEmpty && (
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    All Airports
                  </div>
                )}
                {toGroups.all.map((a) => {
                  const idx = itemCounter++;
                  return renderAirportOption(a, idx, "to", selectToAirport, activeToIndex);
                })}
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="animate-fade-in bg-[#F5F5F7] min-h-screen text-slate-900 pb-16 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-10 max-w-7xl mx-auto px-6 text-center">
        {/* TripSmart logo */}
        <div className="flex items-center justify-center gap-2 mb-3 select-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-base">
            ✈
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">
            Trip<span className="text-blue-600">Smart</span>
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          AI finds the best flight + hotel
          <br />
          combos for your trip
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
          Save time. Save money. Travel smarter.
        </p>
      </section>

      {/* Search Card */}
      <section className="max-w-5xl mx-auto px-6 relative z-10 mb-16">
        <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden p-8 space-y-6" id="search-card">
          {/* Label area (Only One Way) */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full" id="trip-type-label">
              ONE WAY TRIP
            </span>
            <span className="text-xs text-slate-400 font-medium">
          
            </span>
          </div>

          <div className="space-y-6">
            {/* Row 1: From / To / Dates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* From Airport (Autocomplete) */}
              <div className="relative">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  From
                </label>
                <input
                  type="text"
                  value={fromSearch}
                  onChange={(e) => {
                    setFromSearch(e.target.value);
                    if (e.target.value.trim().length >= 1) {
                      setShowFromDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    setShowFromDropdown(true);
                    setActiveFromIndex(0);
                  }}
                  onClick={() => setShowFromDropdown(true)}
                  onKeyDown={handleFromKeyDown}
                  placeholder="From City or Airport"
                  className="w-full bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 text-sm placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  id="input-from"
                  autoComplete="off"
                />
                {renderFromDropdown()}
              </div>

              {/* To Airport (Autocomplete) */}
              <div className="relative">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  To
                </label>
                <input
                  type="text"
                  value={toSearch}
                  onChange={(e) => {
                    setToSearch(e.target.value);
                    if (e.target.value.trim().length >= 1) {
                      setShowToDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    setShowToDropdown(true);
                    setActiveToIndex(0);
                  }}
                  onClick={() => setShowToDropdown(true)}
                  onKeyDown={handleToKeyDown}
                  placeholder="To City or Airport"
                  className="w-full bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 text-sm placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  id="input-to"
                  autoComplete="off"
                />
                {renderToDropdown()}
              </div>

              {/* Departure Date */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={sp.departureDate}
                  onChange={(e) => update({ departureDate: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  id="input-departure"
                />
              </div>

              {/* Hotel Check-out Date */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Check-out Date (Hotel)
                </label>
                <input
                  type="date"
                  value={sp.returnDate}
                  onChange={(e) => update({ returnDate: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  id="input-return"
                />
              </div>
            </div>

            {/* Row 2: Travellers & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-100 pt-5">
              {/* Separate traveller controls: Adults & Children */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
                  Travellers
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between bg-[#F5F5F7] rounded-2xl p-3 border border-transparent hover:border-slate-200 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Adults</div>
                      <div className="text-[10px] text-slate-400 font-medium">Age 12+</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => update({ adults: Math.max(1, sp.adults - 1) })}
                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-slate-800 w-4 text-center">
                        {sp.adults}
                      </span>
                      <button
                        type="button"
                        onClick={() => update({ adults: Math.min(10, sp.adults + 1) })}
                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between bg-[#F5F5F7] rounded-2xl p-3 border border-transparent hover:border-slate-200 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Children</div>
                      <div className="text-[10px] text-slate-400 font-medium">Children (2–12 yrs)</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => update({ children: Math.max(0, sp.children - 1) })}
                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-slate-800 w-4 text-center">
                        {sp.children}
                      </span>
                      <button
                        type="button"
                        onClick={() => update({ children: Math.min(10, sp.children + 1) })}
                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Budget (₹)
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <span className="text-sm font-bold text-slate-450">₹</span>
                    <input
                      type="number"
                      min="5000"
                      max="1000000"
                      step="1000"
                      value={sp.budget || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        update({ budget: Number.isNaN(val) ? 0 : val });
                      }}
                      onBlur={(e) => {
                        let val = parseInt(e.target.value);
                        if (Number.isNaN(val) || val < 5000) val = 5000;
                        if (val > 1000000) val = 1000000;
                        update({ budget: val });
                      }}
                      className="w-24 text-right bg-transparent text-sm font-extrabold text-blue-600 focus:outline-none font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      id="budget-value"
                    />
                  </div>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="5000"
                    max="300000"
                    step="5000"
                    value={sp.budget > 300000 ? 300000 : sp.budget}
                    onChange={(e) =>
                      update({ budget: parseInt(e.target.value) || 5000 })
                    }
                    className="w-full h-2 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    id="input-budget"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-semibold">
                    <span>₹5,000</span>
                    <span>₹1,50,000</span>
                    <span>₹3,00,000{sp.budget > 300000 ? "+" : ""}</span>
                  </div>
                </div>
              </div>
            </div>


            {/* AI Trip Preferences */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>✨</span> Tell TripSmart about your ideal trip
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Describe anything that&apos;s important to you. TripSmart AI will use this along with your selected filters to recommend the best flight + hotel combinations.
                </p>
              </div>
              <textarea
                value={sp.hotelPreferenceText || ""}
                onChange={(e) => update({ hotelPreferenceText: e.target.value })}
                placeholder={`Examples:
• I want a peaceful hotel near the beach with good vegetarian restaurants nearby.
• A modern hotel with high-speed wifi for work and a morning flight to maximize my first day.
• Travel with family, need a child-friendly pool and flight with low layover times.`}
                rows={4}
                className="w-full bg-[#F5F5F7] border border-transparent rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder-slate-400 resize-none leading-relaxed"
                id="input-ai-preferences"
              />
            </div>

            {/* CTA */}
            <button
              onClick={handleSearch}
              disabled={isLoading || !sp.fromAirport || !sp.toAirport || !sp.departureDate || !sp.returnDate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-base font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              id="search-cta"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Finding Best Flight + Hotel Bundle...
                </>
              ) : (
                "Find Best Flight + Hotel Bundle"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Popular Destinations</h2>
          <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            View All
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4" id="popular-destinations">
          {popularDestinations.map((dest, i) => (
            <button
              key={dest.name}
              onClick={() => fillFromDestination(dest)}
              className="relative group overflow-hidden rounded-2xl aspect-[4/3] shadow-sm hover:shadow-md transition-shadow duration-300"
              id={`dest-${dest.name.toLowerCase()}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${dest.color} opacity-90 transition-transform duration-300 group-hover:scale-105`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 text-left">
                <div className="text-white font-bold text-sm">{dest.name}</div>
                <div className="text-white/80 text-[10px] font-semibold">{dest.tagline}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 mb-16 animate-fade-in-up">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 mb-6">Recent Searches</h2>
          <div className="flex gap-4 overflow-x-auto pb-2" id="recent-searches">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                onClick={() => fillFromRecent(search)}
                className="flex-shrink-0 bg-white border border-slate-200/50 shadow-sm rounded-2xl px-5 py-4 hover:border-blue-400 transition-colors text-left min-w-[220px]"
              >
                <div className="text-sm font-bold text-slate-800">
                  {(search.fromAirport || search.from).split("(")[0].trim()} → {(search.toAirport || search.to).split("(")[0].trim()}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1">
                  {formatDate(search.departureDate)} - {formatDate(search.returnDate)}
                  {" · "}
                  {search.travelers} traveller{search.travelers > 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-slate-450 font-medium">
          © 2026 TripSmart. AI-powered travel bundle finder. Designed for modern explorers.
        </div>
      </footer>
    </div>
  );
}
