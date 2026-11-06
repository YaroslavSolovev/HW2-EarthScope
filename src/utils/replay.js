const DAY_MS = 86400000;

export function periodDays(range) {
  if (!range?.start || !range?.end) return 0;
  const start = Date.parse(`${range.start}T00:00:00Z`);
  const end = Date.parse(`${range.end}T00:00:00Z`);
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

export function minimumReplaySeconds(range) {
  return Math.max(20, Math.ceil(periodDays(range) * 2));
}

export function replayTime(range, progress) {
  if (!range) return null;
  const start = Date.parse(`${range.start}T00:00:00Z`);
  const end = Date.parse(`${range.end}T23:59:59.999Z`);
  return new Date(start + (end - start) * Math.min(1, Math.max(0, progress)));
}

export function eventsAtReplayTime(events, time) {
  if (!time) return [];
  const limit = time.getTime();
  return events.flatMap((event) => {
    const observations = event.observations
      .filter((item) => Date.parse(item.time) <= limit)
      .sort((a, b) => a.time.localeCompare(b.time));
    return observations.length
      ? [
          {
            ...event,
            observations,
            firstObservedAt: observations[0].time,
          },
        ]
      : [];
  });
}

export function replayStats(events) {
  return {
    total: events.length,
    usgs: events.filter((event) => event.source === "usgs").length,
    eonet: events.filter((event) => event.source === "eonet").length,
  };
}
