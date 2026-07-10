/**
 * Maps city names and aliases to IATA airport codes for SerpAPI flight search.
 */
const CITY_TO_IATA = {
  MUMBAI: "BOM",
  BOMBAY: "BOM",
  GOA: "GOI",
  DELHI: "DEL",
  "NEW DELHI": "DEL",
  BENGALURU: "BLR",
  BANGALORE: "BLR",
  CHENNAI: "MAA",
  MADRAS: "MAA",
  KOLKATA: "CCU",
  CALCUTTA: "CCU",
  HYDERABAD: "HYD",
  KOCHI: "COK",
  COCHIN: "COK",
  KERALA: "COK",
  NAGPUR: "NAG",
  BALI: "DPS",
  DUBAI: "DXB",
  SINGAPORE: "SIN",
  TOKYO: "HND",
  LONDON: "LHR",
  "NEW YORK": "JFK",
  MANALI: "KUU",
  SHIMLA: "SLV",
};

function normalizeAirportId(value) {
  const raw = String(value || "").trim();
  if (!raw) return raw;

  const upper = raw.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;

  return CITY_TO_IATA[upper] || raw;
}

module.exports = { normalizeAirportId, CITY_TO_IATA };
