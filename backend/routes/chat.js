const express = require("express");
const router = express.Router();

const { searchFlights, searchHotels } = require("../lib/search");
const { parseSearchResults } = require("../lib/parser");
const { evaluateBundles } = require("../lib/bundleEvaluator");

// ---------------------------------------------------------------------------
// Conversation step definitions — order matters
// ---------------------------------------------------------------------------

const STEPS = [
  "welcome",
  "origin",
  "destination",
  "checkIn",
  "checkOut",
  "travelers",
  "budget",
  "airlines",
  "directOnly",
  "departureTime",
  "minRating",
  "amenities",
  "done",
];

function nextStep(current) {
  const idx = STEPS.indexOf(current);
  return STEPS[Math.min(idx + 1, STEPS.length - 1)];
}

// ---------------------------------------------------------------------------
// Session store — module-level Map, keyed by sessionId
// Sessions auto-expire after 30 minutes of inactivity.
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map();

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [id, state] of sessions) {
    if (now - state.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

function createSession() {
  pruneExpiredSessions();
  const id = require("crypto").randomUUID();
  const state = {
    step: "welcome",
    preferences: {},
    createdAt: Date.now(),
  };
  sessions.set(id, state);
  return { id, state };
}

function getSession(id) {
  const s = sessions.get(id);
  if (s) s.createdAt = Date.now(); // refresh TTL on access
  return s;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidDate(str) {
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function isFutureDate(str) {
  return new Date(str) > new Date();
}

function toYYYYMMDD(raw) {
  const d = new Date(raw.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, "$3-$2-$1"));
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return raw.trim();
}

// ---------------------------------------------------------------------------
// Step processors — each returns { reply, step, valid }
// ---------------------------------------------------------------------------

function processWelcome(state) {
  state.step = "origin";
  return {
    reply:
      "✈️ Hi! I'm **TripSmart**, your AI travel planner. I'll help you find the best flight + hotel bundles tailored to your budget.\n\n" +
      "Let's start! 🌍 **Which city will you be departing from?**\n_(e.g., Mumbai, Delhi, Bengaluru, Nagpur)_",
    step: "origin",
  };
}

function processOrigin(message, state) {
  const origin = message.trim();
  if (!origin || origin.length < 2) {
    return { reply: "Please enter a valid departure city (e.g., Mumbai, Nagpur).", step: "origin", valid: false };
  }
  state.preferences.origin = origin;
  state.step = "destination";
  return {
    reply: `Great! Departing from **${origin}**. 🏙️\n\n🗺️ **Where would you like to go?**\n_(e.g., Goa, Shimla, Manali, Kerala)_`,
    step: "destination",
    valid: true,
  };
}

function processDestination(message, state) {
  const destination = message.trim();
  if (!destination || destination.length < 2) {
    return { reply: "Please enter a valid destination city (e.g., Goa, Manali).", step: "destination", valid: false };
  }
  state.preferences.destination = destination;
  state.step = "checkIn";
  return {
    reply: `Awesome! Heading to **${destination}**. 🌴\n\n📅 **What is your check-in / departure date?**\n_(Format: DD/MM/YYYY — e.g., 15/10/2026)_`,
    step: "checkIn",
    valid: true,
  };
}

function processCheckIn(message, state) {
  const raw = message.trim();
  const dateStr = toYYYYMMDD(raw);
  if (!isValidDate(dateStr)) {
    return { reply: "⚠️ That doesn't look like a valid date. Please use DD/MM/YYYY format — e.g., **15/10/2026**.", step: "checkIn", valid: false };
  }
  if (!isFutureDate(dateStr)) {
    return { reply: "⚠️ Check-in date must be in the future. Please enter a future date.", step: "checkIn", valid: false };
  }
  state.preferences.checkIn = dateStr;
  state.step = "checkOut";
  return {
    reply: `📅 Check-in set to **${dateStr}**.\n\n🔚 **What is your check-out / return date?**\n_(Must be after check-in — e.g., ${advanceDays(dateStr, 3)})_`,
    step: "checkOut",
    valid: true,
  };
}

function processCheckOut(message, state) {
  const raw = message.trim();
  const dateStr = toYYYYMMDD(raw);
  if (!isValidDate(dateStr)) {
    return { reply: "⚠️ That doesn't look like a valid date. Please use DD/MM/YYYY format — e.g., **17/10/2026**.", step: "checkOut", valid: false };
  }
  const checkIn = state.preferences.checkIn;
  if (new Date(dateStr) <= new Date(checkIn)) {
    return { reply: `⚠️ Check-out date must be **after** your check-in date (${checkIn}). Please try again.`, step: "checkOut", valid: false };
  }
  state.preferences.checkOut = dateStr;
  state.step = "travelers";
  return {
    reply: `✅ Check-out set to **${dateStr}**.\n\n👥 **How many travelers?** _(1–10)_`,
    step: "travelers",
    valid: true,
  };
}

function processTravelers(message, state) {
  const n = parseInt(message.trim(), 10);
  if (isNaN(n) || n < 1 || n > 10) {
    return { reply: "⚠️ Please enter a number of travelers between **1 and 10**.", step: "travelers", valid: false };
  }
  state.preferences.travelers = n;
  state.step = "budget";
  return {
    reply: `👥 **${n} traveler${n > 1 ? "s" : ""}** noted.\n\n💰 **What is your total trip budget in ₹ (INR)?**\n_(e.g., 50000 — covers flights + hotel for all travelers)_`,
    step: "budget",
    valid: true,
  };
}

function processBudget(message, state) {
  const raw = message.replace(/[₹,\s]/g, "");
  const n = parseFloat(raw);
  if (isNaN(n) || n <= 0) {
    return { reply: "⚠️ Please enter a valid positive budget amount in ₹ (e.g., **50000**).", step: "budget", valid: false };
  }
  state.preferences.budget = n;
  state.step = "airlines";
  return {
    reply: `💰 Budget set to **₹${n.toLocaleString("en-IN")}**.\n\n✈️ **Do you have a preferred airline?**\n_(Type the airline name or IATA code, or type **any** for no preference)_`,
    step: "airlines",
    valid: true,
  };
}

function processAirlines(message, state) {
  const val = message.trim().toLowerCase();
  state.preferences.airlines = val === "any" || val === "no" || val === "" ? "any" : message.trim();
  state.step = "directOnly";
  return {
    reply: `✈️ Airline preference: **${state.preferences.airlines}**.\n\n🛬 **Do you prefer direct (non-stop) flights only?**\n_(Reply **yes** or **no**)_`,
    step: "directOnly",
    valid: true,
  };
}

function processDirectOnly(message, state) {
  const val = message.trim().toLowerCase();
  if (!["yes", "no", "y", "n"].includes(val)) {
    return { reply: "⚠️ Please reply with **yes** or **no** — do you want direct flights only?", step: "directOnly", valid: false };
  }
  state.preferences.directOnly = val === "yes" || val === "y";
  state.step = "departureTime";
  return {
    reply: `🛬 Direct only: **${state.preferences.directOnly ? "Yes" : "No"}**.\n\n🕐 **What is your preferred departure time?**\n_(Reply: **morning** / **afternoon** / **evening** / **any**)_`,
    step: "departureTime",
    valid: true,
  };
}

function processDepartureTime(message, state) {
  const val = message.trim().toLowerCase();
  const valid = ["morning", "afternoon", "evening", "any"];
  if (!valid.includes(val)) {
    return { reply: "⚠️ Please choose from: **morning**, **afternoon**, **evening**, or **any**.", step: "departureTime", valid: false };
  }
  state.preferences.departureTime = val;
  state.step = "minRating";
  return {
    reply: `🕐 Departure time: **${val}**.\n\n⭐ **What minimum hotel rating do you require?**\n_(Enter a number from **1 to 5**, e.g., 3 or 4 — or type **0** for no preference)_`,
    step: "minRating",
    valid: true,
  };
}

function processMinRating(message, state) {
  const n = parseFloat(message.trim());
  if (isNaN(n) || n < 0 || n > 5) {
    return { reply: "⚠️ Please enter a rating between **0 and 5** (e.g., 3, 4, or 0 for no preference).", step: "minRating", valid: false };
  }
  state.preferences.minRating = n;
  state.step = "amenities";
  return {
    reply: `⭐ Minimum hotel rating: **${n > 0 ? n + " stars" : "No preference"}**.\n\n🏊 **Any required hotel amenities?**\n_(Type comma-separated amenities, e.g., **Pool, Free Wi-Fi, Gym** — or type **none** for no preference)_`,
    step: "amenities",
    valid: true,
  };
}

function processAmenities(message, state) {
  const raw = message.trim().toLowerCase();
  if (raw === "none" || raw === "no" || raw === "") {
    state.preferences.amenities = [];
  } else {
    state.preferences.amenities = message.split(",").map((a) => a.trim()).filter(Boolean);
  }
  state.step = "done";
  const amenityStr = state.preferences.amenities.length > 0 ? state.preferences.amenities.join(", ") : "None";
  return {
    reply:
      `🏊 Amenities: **${amenityStr}**.\n\n` +
      `🔍 Perfect! I have everything I need. Let me search for the best flight + hotel bundles for your trip...\n\n` +
      `📍 **${state.preferences.origin}** → **${state.preferences.destination}**\n` +
      `📅 ${state.preferences.checkIn} to ${state.preferences.checkOut}\n` +
      `👥 ${state.preferences.travelers} traveler(s) · 💰 ₹${(state.preferences.budget ?? 0).toLocaleString("en-IN")} budget\n\n` +
      `⏳ Searching... this may take a few seconds.`,
    step: "done",
    valid: true,
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function advanceDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Pipeline runner — called once all steps are complete
// ---------------------------------------------------------------------------

async function runPipeline(preferences) {
  const flightDate = new Date(preferences.checkIn);
  const checkIn = new Date(preferences.checkIn);
  const checkOut = new Date(preferences.checkOut);

  const [rawFlights, rawHotels] = await Promise.all([
    searchFlights(preferences.origin, preferences.destination, flightDate, preferences.travelers, preferences),
    searchHotels(preferences.destination, checkIn, checkOut, preferences.travelers, preferences),
  ]);

  const parsedData = await parseSearchResults(rawFlights, rawHotels, preferences);
  const bundles = await evaluateBundles(parsedData, preferences);

  if (bundles.length === 0) {
    return {
      reply:
        "😕 I searched thoroughly but couldn't find any flight + hotel bundles within your budget of " +
        `₹${preferences.budget.toLocaleString("en-IN")}.\n\n` +
        "**Suggestions to get results:**\n" +
        "• Increase your budget\n" +
        "• Relax your direct-flight preference\n" +
        "• Lower your minimum hotel rating\n" +
        "• Choose different travel dates\n\n" +
        "Would you like to start a new search with adjusted preferences?",
      bundles: [],
    };
  }

  const best = bundles[0];
  const bd = best?.flightDetails;
  const hd = best?.hotelDetails;

  return {
    reply:
      `🎉 Great news! I found **${bundles.length} bundle${bundles.length > 1 ? "s" : ""}** for your trip to **${preferences.destination}**!\n\n` +
      `🏆 **Best deal:**\n` +
      `✈️ ${bd?.airline ?? "Flight"} · Departs ${bd?.departureTime ?? ""} · ₹${(bd?.pricePerPerson ?? 0).toLocaleString("en-IN")}/person\n` +
      `🏨 ${hd?.name ?? "Hotel"} · ${hd?.rating ?? ""}⭐ · ₹${(hd?.pricePerNight ?? 0).toLocaleString("en-IN")}/night\n` +
      `💰 Total: ₹${(best?.totalCost ?? 0).toLocaleString("en-IN")} · Verdict: **${best?.verdict ?? ""}**\n\n` +
      `Scroll down to explore all ${bundles.length} bundle${bundles.length > 1 ? "s" : ""} in detail! 👇`,
    bundles,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

router.post("/", async (req, res) => {
  const { message = "", step: clientStep, sessionId: clientSessionId, preferences: clientPreferences } = req.body;

  // --- Direct search override ---
  if (clientStep === "search_direct" && clientPreferences) {
    try {
      const { reply: pipelineReply, bundles } = await runPipeline(clientPreferences);
      return res.json({
        reply: pipelineReply,
        step: "done",
        complete: true,
        bundles,
        sessionId: clientSessionId || "",
      });
    } catch (e) {
      console.error("[chat/route] Pipeline error:", e);
      return res.json({
        reply: "⚠️ Something went wrong while searching. Please try again.",
        step: "done",
        complete: true,
        bundles: [],
        sessionId: clientSessionId || "",
      });
    }
  }

  // --- Welcome / session initialisation ---
  if (!clientSessionId || clientStep === "welcome") {
    const { id, state } = createSession();
    const { reply, step } = processWelcome(state);
    return res.json({ reply, step, complete: false, bundles: null, sessionId: id, preferences: state.preferences });
  }

  // --- Retrieve existing session ---
  const state = getSession(clientSessionId);
  if (!state) {
    const { id, state: newState } = createSession();
    const { reply, step } = processWelcome(newState);
    return res.json({
      reply: "⏳ Your session expired. Let's start fresh!\n\n" + reply,
      step,
      complete: false,
      bundles: null,
      sessionId: id,
      preferences: newState.preferences,
    });
  }

  // --- Route message to the correct step processor ---
  let reply = "";
  let nextStepVal = state.step;
  let valid = true;

  switch (state.step) {
    case "origin": { const r = processOrigin(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "destination": { const r = processDestination(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "checkIn": { const r = processCheckIn(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "checkOut": { const r = processCheckOut(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "travelers": { const r = processTravelers(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "budget": { const r = processBudget(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "airlines": { const r = processAirlines(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "directOnly": { const r = processDirectOnly(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "departureTime": { const r = processDepartureTime(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "minRating": { const r = processMinRating(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "amenities": { const r = processAmenities(message, state); reply = r.reply; nextStepVal = r.step; valid = r.valid; break; }
    case "done":
    case "welcome":
    default: {
      const { id, state: newState } = createSession();
      const { reply: wReply, step: wStep } = processWelcome(newState);
      return res.json({
        reply: "🔄 Starting a new search!\n\n" + wReply,
        step: wStep,
        complete: false,
        bundles: null,
        sessionId: id,
        preferences: newState.preferences,
      });
    }
  }

  // --- If input was invalid, return same step ---
  if (!valid) {
    return res.json({ reply, step: nextStepVal, complete: false, bundles: null, sessionId: clientSessionId, preferences: state.preferences });
  }

  // --- All steps done — run the full pipeline ---
  if (nextStepVal === "done") {
    try {
      const prefs = state.preferences;
      const { reply: pipelineReply, bundles } = await runPipeline(prefs);
      sessions.delete(clientSessionId);
      return res.json({ reply: pipelineReply, step: "done", complete: true, bundles, sessionId: clientSessionId, preferences: state.preferences });
    } catch (e) {
      console.error("[chat/route] Pipeline error:", e);
      return res.json({
        reply: "⚠️ Something went wrong while searching for bundles. Please try again in a moment.",
        step: "done",
        complete: true,
        bundles: [],
        sessionId: clientSessionId,
        preferences: state.preferences,
      });
    }
  }

  // --- Normal mid-conversation response ---
  return res.json({ reply, step: nextStepVal, complete: false, bundles: null, sessionId: clientSessionId, preferences: state.preferences });
});

module.exports = router;
