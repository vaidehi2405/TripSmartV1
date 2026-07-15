"use client";

import { useTrip } from "../context/TripContext";

const badgeConfig: Record<string, { label: string; class: string }> = {
  "Best Overall": { label: "Best Overall", class: "badge-best" },
  Cheapest: { label: "Cheapest", class: "badge-cheapest" },
  "Best Hotel": { label: "Best Hotel", class: "badge-hotel" },
  "Best Flight Time": { label: "Best Flight Time", class: "badge-fastest" },
};

interface BundleCardProps {
  bundle: any;
  index: number;
  originalIndex: number;
}

export default function BundleCard({
  bundle,
  index,
  originalIndex,
}: BundleCardProps) {
  const { goToBundle, searchParams } = useTrip();
  const flight = bundle.flightDetails || {};
  const hotel = bundle.hotelDetails || {};
  const reasons = Array.isArray(bundle.reasons) ? bundle.reasons : [];
  const confirmedReasons = reasons.filter(
    (r: any) => r.match_status === "confirmed"
  );
  const missedReasons = reasons.filter(
    (r: any) => r.match_status === "mismatch"
  );
  const unresolvedReasons = reasons.filter(
    (r: any) =>
      r.match_status === "unresolved" || r.match_status === "unverified"
  );

  // Use deterministic label from backend (Guardrail D)
  const badge = bundle.rankLabel ? badgeConfig[bundle.rankLabel] : null;

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

  const hasAiRequest =
    searchParams.hotelPreferenceText &&
    searchParams.hotelPreferenceText.trim().length > 0;

  return (
    <div
      className={`card p-0 overflow-hidden animate-fade-in-up stagger-${
        index + 1
      } hover:border-blue-100`}
      id={`bundle-card-${index}`}
    >
      <div className="flex flex-col md:flex-row">
        {/* Flight + Hotel Info */}
        <div className="flex-1 p-5">
          {/* Badge */}
          {badge && (
            <span className={`badge ${badge.class} mb-3`}>{badge.label}</span>
          )}

          {/* Partial match warning (Guardrail B) */}
          {bundle.preferenceMatch === "partial" &&
            bundle.hardViolations?.length > 0 && (
              <div className="mb-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                ⚠ Does not match all requirements:{" "}
                {bundle.hardViolations.join(", ")}
              </div>
            )}

          {/* Flight section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✈️</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800">
                {flight.airline || "Airline"}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-800">
                  {flight.departureTime || "--:--"}
                </span>
                <span className="text-xs text-slate-400">—</span>
                <span className="text-sm font-bold text-slate-800">
                  {flight.arrivalTime || "--:--"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {stopsText} · {fromCode} → {toCode}
              </div>
            </div>
          </div>

          {/* Hotel section */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100">
              {hotel.image ? (
                <img
                  src={hotel.image}
                  alt={hotel.name || "Hotel"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <span className="text-2xl">🏨</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hotel
              </div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                {hotel.name || "Hotel"}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                <span className="text-xs text-amber-500 font-semibold">
                  ★ {hotel.rating || "—"}
                </span>
                {hotel.amenities
                  ?.slice(0, 4)
                  .map((a: string, i: number) => (
                    <span key={i} className="text-[10px] text-slate-400">
                      · {a}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Why TripSmart recommends this (Guardrail I — only confirmed reasons from scoring) */}
          {hasAiRequest && confirmedReasons.length > 0 && (
            <div className="mt-4 rounded-lg border border-blue-50 bg-blue-50/60 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                Why TripSmart recommends this
              </div>

              <div
                className="text-[10px] text-blue-600 mt-1 mb-2 font-medium truncate"
                title={searchParams.hotelPreferenceText}
              >
                Based on your request: &ldquo;
                {searchParams.hotelPreferenceText}&rdquo;
              </div>

              {/* Match summary — calibrated language (Guardrail E) */}
              {bundle.matchSummary && (
                <div className="text-[10px] text-slate-500 mb-1.5">
                  {bundle.matchSummary}
                </div>
              )}

              <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                {confirmedReasons.slice(0, 3).map((reason: any, i: number) => (
                  <li key={`reason-${i}`} className="flex gap-1.5">
                    <span className="text-emerald-500 shrink-0">✓</span>
                    <span>{reason.explanation}</span>
                  </li>
                ))}
                {missedReasons.slice(0, 2).map((reason: any, i: number) => (
                  <li
                    key={`missed-${i}`}
                    className="flex gap-1.5 text-amber-600"
                  >
                    <span className="shrink-0">✗</span>
                    <span>{reason.explanation}</span>
                  </li>
                ))}
                {unresolvedReasons
                  .slice(0, 2)
                  .map((reason: any, i: number) => (
                    <li
                      key={`unresolved-${i}`}
                      className="flex gap-1.5 text-slate-400"
                    >
                      <span className="shrink-0">?</span>
                      <span>{reason.explanation}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="md:w-48 border-t md:border-t-0 md:border-l border-slate-100 p-5 flex flex-col items-end justify-center bg-slate-50/50">
          <div className="text-2xl font-extrabold text-slate-800">
            ₹{(bundle.totalCost ?? 0).toLocaleString("en-IN")}
          </div>
          {/* Budget accuracy (Guardrail C) */}
          <div className="text-[10px] text-slate-400 mt-0.5 text-right leading-relaxed">
            {bundle.pricingNote ||
              `Total for ${searchParams.travelers} adult${searchParams.travelers > 1 ? "s" : ""}. Add-ons may cost extra.`}
          </div>
          <button
            onClick={() => goToBundle(originalIndex)}
            className="mt-3 btn-outline !px-5 !py-2 !text-xs !rounded-lg"
            id={`view-details-${index}`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
