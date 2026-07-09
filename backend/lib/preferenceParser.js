// groq is lazy-loaded inside parseTripPreferences to avoid crashing at import time
// when USE_MOCK=true and no GROQ_API_KEY is set.

/**
 * Extracts structured preferences from natural language input using Groq.
 * @param {string} text 
 * @returns {Promise<object>}
 */
async function parseTripPreferences(text) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    return emptyPreferences();
  }

  // When using mock data, skip Groq but still apply simple keyword extraction
  // so the UI can explain obvious AI-field preferences in local smoke tests.
  if (process.env.USE_MOCK === "true") {
    return emptyPreferences(text);
  }

  const { groq } = require("./groq");

  try {
    const prompt = `You are a travel preference extractor. Analyze the user's natural language trip description and extract structured travel preferences.

User input: "${text}"

Extract the following preferences in JSON format. Return ONLY the raw JSON object — no markdown, no code blocks, no explanations, no extra characters.
{
  "travellerType": "solo" | "couple" | "family" | "friends" | "business" | null,
  "elderlyTravellers": boolean | null,
  "hotelPreferences": string[],
  "flightPreferences": {
    "avoidDeparture": "early_morning" | "late_night" | "layover" | null,
    "timeOfDay": "morning" | "afternoon" | "evening" | null
  }
}

Example output:
{
  "travellerType": "family",
  "elderlyTravellers": true,
  "hotelPreferences": ["quiet area", "near beach"],
  "flightPreferences": {
    "avoidDeparture": "early_morning",
    "timeOfDay": "afternoon"
  }
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a precise data extraction agent. You only output raw valid JSON as requested, with no other text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 1000
    });

    let raw = completion.choices?.[0]?.message?.content ?? "{}";
    raw = raw.trim();
    // Strip code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const parsed = JSON.parse(raw);
    return {
      travellerType: parsed.travellerType || null,
      elderlyTravellers: typeof parsed.elderlyTravellers === "boolean" ? parsed.elderlyTravellers : null,
      hotelPreferences: [
        ...new Set([
          ...parseBasicHotelPreferences(text),
          ...(Array.isArray(parsed.hotelPreferences) ? parsed.hotelPreferences : []),
        ]),
      ],
      flightPreferences: parsed.flightPreferences || {}
    };
  } catch (err) {
    console.error("[preferenceParser] Failed to parse preferences:", err);
    return emptyPreferences(text);
  }
}


function parseBasicHotelPreferences(text) {
  const normalized = String(text || "").toLowerCase();
  const hotelPreferences = [];
  if (/pet|pets|dog|cat|frien?d?ly|frienfly/.test(normalized) && /pet|dog|cat/.test(normalized)) {
    hotelPreferences.push("pet-friendly hotel");
  }
  if (/pool/.test(normalized)) hotelPreferences.push("pool");
  if (/spa/.test(normalized)) hotelPreferences.push("spa");
  if (/gym|fitness/.test(normalized)) hotelPreferences.push("gym");
  if (/breakfast/.test(normalized)) hotelPreferences.push("breakfast");
  if (/wifi|wi-fi|internet/.test(normalized)) hotelPreferences.push("free wi-fi");
  return hotelPreferences;
}

function emptyPreferences(text = "") {
  return {
    travellerType: null,
    elderlyTravellers: null,
    hotelPreferences: parseBasicHotelPreferences(text),
    flightPreferences: {}
  };
}

module.exports = { parseTripPreferences };
