import test from "node:test";
import assert from "node:assert/strict";
import {
  eventsInPeriod,
  filterEvents,
  validateHistoryDates,
} from "../src/utils/filters.js";
import { mergeEvents } from "../src/utils/mergeEvents.js";
import { fetchUsgsHistory } from "../src/api/usgs.js";

const observation = (time, lon = 10) => ({
  time,
  geometry: { type: "Point", coordinates: [lon, 20] },
});

test("History принимает ровно 90 дней и отсекает будущие даты", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  assert.equal(validateHistoryDates("2026-08-08", "2026-11-05", now), null);
  assert.match(validateHistoryDates("2026-08-07", "2026-11-05", now), /90/);
  assert.match(
    validateHistoryDates("2026-11-06", "2026-11-06", now),
    /будущем/,
  );
});

test("History показывает только наблюдения выбранных дат", () => {
  const event = {
    id: "eonet:1",
    observations: [
      observation("2026-10-31T23:59:59.000Z"),
      observation("2026-11-01T00:00:00.000Z"),
      observation("2026-11-02T00:00:00.000Z"),
    ],
  };
  const result = eventsInPeriod([event], "history", 7, {
    start: "2026-11-01",
    end: "2026-11-01",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].observations.length, 1);
  assert.equal(result[0].firstObservedAt, "2026-11-01T00:00:00.000Z");
});

test("Категории с несколькими значениями и фильтры работают вместе", () => {
  const events = [
    {
      source: "usgs",
      categoryIds: ["earthquake"],
      title: "Japan",
      metadata: {},
      intensity: { value: 5.1 },
    },
    {
      source: "eonet",
      categoryIds: ["wildfires", "drought"],
      title: "Fire",
      metadata: {},
      status: "closed",
    },
  ];
  assert.deepEqual(
    filterEvents(events, {
      categoryIds: new Set(["drought"]),
      query: "fire",
      minMagnitude: "6",
      status: "closed",
    }),
    [events[1]],
  );
  assert.equal(
    filterEvents(events, {
      categoryIds: new Set(),
      query: "",
      minMagnitude: "",
      status: "all",
    }).length,
    0,
  );
});

test("Повторное событие сохраняет разные наблюдения", () => {
  const first = {
    id: "eonet:1",
    categoryIds: ["wildfires"],
    observations: [observation("2026-11-01T00:00:00Z")],
  };
  const second = {
    ...first,
    categoryIds: ["drought"],
    observations: [
      observation("2026-11-01T00:00:00Z"),
      observation("2026-11-02T00:00:00Z", 11),
    ],
  };
  const result = mergeEvents([first, second]);
  assert.equal(result.length, 1);
  assert.equal(result[0].observations.length, 2);
  assert.deepEqual(result[0].categoryIds, ["wildfires", "drought"]);
});

test("USGS HTTP 204 означает пустой исторический результат", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ status: 204 });
  try {
    const result = await fetchUsgsHistory({
      start: "2026-11-01",
      end: "2026-11-01",
    });
    assert.deepEqual(result, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
