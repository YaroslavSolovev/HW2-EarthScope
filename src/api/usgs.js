import { normalizeUsgsResponse } from "../utils/normalizeUsgs.js";
import { mergeEvents } from "../utils/mergeEvents.js";

const FEEDS = {
  1: "4.5_day.geojson",
  7: "4.5_week.geojson",
  30: "4.5_month.geojson",
};

async function readEarthquakes(url, signal) {
  const response = await fetch(url, { signal });
  if (response.status === 204) return { events: [], count: 0 };
  if (!response.ok)
    throw Error(`USGS: HTTP request failed (${response.status})`);
  const data = await response.json();
  if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw Error("USGS: invalid response format");
  }
  return { events: normalizeUsgsResponse(data), count: data.features.length };
}

export async function fetchUsgsEarthquakes({ signal, days = 1 } = {}) {
  const feed = FEEDS[days];
  if (!feed) throw Error("Unknown Live period");
  const result = await readEarthquakes(
    `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}`,
    signal,
  );
  return result.events;
}

export async function fetchUsgsHistory({ start, end, signal } = {}) {
  const result = [];
  let cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  // Small intervals keep the catalog request manageable. Split again at the limit.
  async function loadPart(from, to) {
    const url = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
    url.search = new URLSearchParams({
      format: "geojson",
      starttime: from.toISOString(),
      endtime: to.toISOString(),
      minmagnitude: "4.5",
      limit: "20000",
      orderby: "time",
    });
    const { events, count } = await readEarthquakes(url, signal);
    if (count >= 20000) {
      if (to - from <= 1000) {
        throw Error("USGS: too many events in one interval");
      }
      const middle = new Date((from.getTime() + to.getTime()) / 2);
      await loadPart(from, middle);
      await loadPart(middle, to);
    } else {
      result.push(...events);
    }
  }

  while (cursor <= last) {
    const next = new Date(
      Math.min(
        cursor.getTime() + 15 * 86400000,
        last.getTime() + 86400000,
        Date.now(),
      ),
    );
    if (next <= cursor) break;
    await loadPart(cursor, next);
    cursor = next;
  }
  return mergeEvents(result);
}
