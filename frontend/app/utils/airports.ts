export interface AirportRecord {
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  latitude: number;
  longitude: number;
}

let cachedAirports: AirportRecord[] = [];
let loadPromise: Promise<AirportRecord[]> | null = null;

export function loadAirports(): Promise<AirportRecord[]> {
  if (cachedAirports.length > 0) {
    return Promise.resolve(cachedAirports);
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // Dynamically import the dataset from airportsjs
      const airportsRawModule = await import("airportsjs/airports.json");
      const airportsRaw = airportsRawModule.default || airportsRawModule;

      const iataToIcao: Record<string, string> = {};
      try {
        // Dynamically import airport-data-js to map IATA -> ICAO codes
        const airportDataJs = await import("airport-data-js");
        const list = await airportDataJs.findAirports({});
        list.forEach((a: any) => {
          if (a.iata && a.iata.trim() !== "") {
            iataToIcao[a.iata.toUpperCase()] = a.icao || "";
          }
        });
      } catch (err) {
        console.error("Failed to load ICAO codes from airport-data-js:", err);
      }

      cachedAirports = airportsRaw.map((a: any) => {
        const iata = a.iata || "";
        const icao = iataToIcao[iata.toUpperCase()] || "";
        return {
          name: a.name.replace(/\s*\([^)]*\)\s*$/, "").trim(),
          city: a.city || "",
          country: a.country || "",
          iata: iata,
          icao: icao,
          latitude: Number(a.latitude) || 0,
          longitude: Number(a.longitude) || 0,
        };
      });

      return cachedAirports;
    } catch (error) {
      console.error("Failed to parse and load global airport database:", error);
      return [];
    }
  })();

  return loadPromise;
}
