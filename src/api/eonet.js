import {
  normalizeEonetCategories,
  normalizeEonetResponse,
} from "../utils/normalizeEonet.js";
import { mergeEvents } from "../utils/mergeEvents.js";

const BASE = "https://eonet.gsfc.nasa.gov/api/v3";

async function readJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw Error(`NASA EONET: ошибка HTTP ${response.status}`);
  return response.json();
}

async function readEvents(params, signal) {
  const url = new URL(`${BASE}/events`);
  url.search = new URLSearchParams({ status: "all", ...params });
  const data = await readJson(url, signal);
  if (!Array.isArray(data?.events))
    throw Error("NASA EONET: неверный формат ответа");
  return { events: normalizeEonetResponse(data), count: data.events.length };
}

export async function fetchEonetCategories({ signal } = {}) {
  const data = await readJson(`${BASE}/categories`, signal);
  if (!Array.isArray(data?.categories)) {
    throw Error("NASA EONET: неверный формат категорий");
  }
  return normalizeEonetCategories(data);
}

export async function fetchEonetEvents({ signal, days = 7 } = {}) {
  const result = await readEvents(
    { days: String(days + 1), limit: "5000" },
    signal,
  );
  if (result.count < 5000) return result.events;
  const start = new Date(Date.now() - days * 86400000)
    .toISOString()
    .slice(0, 10);
  const end = new Date().toISOString().slice(0, 10);
  return fetchEonetHistory({ start, end, signal });
}

export async function fetchEonetHistory({ start, end, signal } = {}) {
  const result = [];
  let cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  async function loadPart(from, to) {
    const { events, count } = await readEvents(
      {
        start: from.toISOString().slice(0, 10),
        end: to.toISOString().slice(0, 10),
        limit: "5000",
      },
      signal,
    );
    if (count >= 5000) {
      if (from.getTime() === to.getTime()) {
        throw Error("NASA EONET: дневной ответ достиг лимита 5000 событий");
      }
      const days = Math.floor((to - from) / 86400000);
      const middle = new Date(from.getTime() + Math.floor(days / 2) * 86400000);
      await loadPart(from, middle);
      await loadPart(new Date(middle.getTime() + 86400000), to);
    } else {
      result.push(...events);
    }
  }

  while (cursor <= last) {
    const next = new Date(
      Math.min(cursor.getTime() + 14 * 86400000, last.getTime()),
    );
    await loadPart(cursor, next);
    cursor = new Date(next.getTime() + 86400000);
  }
  return mergeEvents(result);
}
