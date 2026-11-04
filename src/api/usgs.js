import { normalizeUsgsResponse } from "../utils/normalizeUsgs.js";
export async function fetchUsgsEarthquakes({ signal } = {}) {
  const r = await fetch(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
    { signal },
  );
  if (!r.ok) throw Error("USGS request failed (" + r.status + ")");
  const d = await r.json();
  if (d?.type !== "FeatureCollection" || !Array.isArray(d.features))
    throw Error("Invalid USGS response");
  return normalizeUsgsResponse(d);
}
