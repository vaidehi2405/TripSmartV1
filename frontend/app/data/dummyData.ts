export const popularDestinations = [
  {
    name: "Goa",
    tagline: "Beaches & nightlife",
    code: "GOI",
    color: "from-cyan-400 to-blue-500",
  },
  {
    name: "Bali",
    tagline: "Tropical paradise",
    code: "DPS",
    color: "from-emerald-400 to-teal-500",
  },
  {
    name: "Dubai",
    tagline: "Luxury & shopping",
    code: "DXB",
    color: "from-amber-400 to-orange-500",
  },
  {
    name: "Manali",
    tagline: "Mountains & snow",
    code: "KUL",
    color: "from-sky-400 to-indigo-500",
  },
  {
    name: "Singapore",
    tagline: "Urban adventures",
    code: "SIN",
    color: "from-violet-400 to-purple-500",
  },
  {
    name: "Kerala",
    tagline: "Backwaters & nature",
    code: "COK",
    color: "from-green-400 to-emerald-500",
  },
];

export const airports = [
  { city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport", code: "BOM", country: "India" },
  { city: "Goa", name: "Manohar International Airport", code: "GOX", country: "India" },
  { city: "Goa", name: "Dabolim Airport", code: "GOI", country: "India" },
  { city: "Delhi", name: "Indira Gandhi International Airport", code: "DEL", country: "India" },
  { city: "Bengaluru", name: "Kempegowda International Airport", code: "BLR", country: "India" },
  { city: "Chennai", name: "Chennai International Airport", code: "MAA", country: "India" },
  { city: "Kolkata", name: "Netaji Subhash Chandra Bose International Airport", code: "CCU", country: "India" },
  { city: "Hyderabad", name: "Rajiv Gandhi International Airport", code: "HYD", country: "India" },
  { city: "Kochi", name: "Cochin International Airport", code: "COK", country: "India" },
  { city: "Nagpur", name: "Dr. Babasaheb Ambedkar International Airport", code: "NAG", country: "India" },
  { city: "Bali", name: "Ngurah Rai International Airport", code: "DPS", country: "Indonesia" },
  { city: "Dubai", name: "Dubai International Airport", code: "DXB", country: "UAE" },
  { city: "Singapore", name: "Changi Airport", code: "SIN", country: "Singapore" },
  { city: "Tokyo", name: "Haneda Airport", code: "HND", country: "Japan" },
  { city: "London", name: "Heathrow Airport", code: "LHR", country: "United Kingdom" },
  { city: "New York", name: "John F. Kennedy International Airport", code: "JFK", country: "United States" },
];

export const defaultSearchParams = {
  from: "Mumbai (BOM)",
  to: "Goa (GOI)",
  fromAirport: "Mumbai (BOM)",
  toAirport: "Goa (GOI)",
  departureDate: "",
  returnDate: "",
  travelers: 2,
  adults: 2,
  children: 0,
  budget: 25000,
  tripType: "oneWay" as "oneWay",
  // Flight preferences
  airlines: "any",
  directOnly: false,
  departureTime: "morning",
  // Hotel preferences
  minRating: 4,
  amenities: ["Pool", "Free Wi-Fi", "Breakfast"],
  hotelPreferenceText: "",
};

export type SearchParams = typeof defaultSearchParams;

// Helper to generate dates relative to today
export function getDefaultDates(): { departure: string; returnDate: string } {
  const today = new Date();
  const departure = new Date(today);
  departure.setDate(today.getDate() + 35);
  const returnD = new Date(departure);
  returnD.setDate(departure.getDate() + 4);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { departure: fmt(departure), returnDate: fmt(returnD) };
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    weekday: "short",
  });
}

export function calcNights(checkIn: string, checkOut: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const inMs = new Date(checkIn).getTime();
  const outMs = new Date(checkOut).getTime();
  if (isNaN(inMs) || isNaN(outMs) || outMs <= inMs) return 1;
  return Math.round((outMs - inMs) / msPerDay);
}

// Map city display names to backend-compatible format
export function extractCityName(display: string): string {
  // "Mumbai (BOM)" -> "Mumbai"
  const match = display.match(/^([^(]+)/);
  return match ? match[1].trim() : display.trim();
}

export function extractCityCode(display: string): string {
  // "Mumbai (BOM)" -> "BOM"
  const match = display.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : display.trim();
}
