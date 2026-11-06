const DAY_MS = 86400000;

export function validateHistoryDates(start, end, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return "Please enter both dates.";
  }
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    from.toISOString().slice(0, 10) !== start ||
    to.toISOString().slice(0, 10) !== end
  ) {
    return "Check the date format.";
  }
  if (from > to) return "The start date is after the end date.";
  if (Math.round((to - from) / DAY_MS) + 1 > 90) {
    return "You can select up to 90 calendar days.";
  }
  if (to > today) return "The end date is in the future.";
  return null;
}

export function latestTime(event) {
  return event.observations.reduce(
    (latest, item) => (item.time > latest ? item.time : latest),
    "",
  );
}

export function eventsInPeriod(events, mode, days, range, now = Date.now()) {
  if (mode === "live") {
    const cutoff = now - days * DAY_MS;
    return events.filter((event) => Date.parse(latestTime(event)) >= cutoff);
  }
  if (!range) return [];
  const from = `${range.start}T00:00:00.000Z`;
  const to = `${range.end}T23:59:59.999Z`;
  return events.flatMap((event) => {
    const observations = event.observations.filter(
      (item) => item.time >= from && item.time <= to,
    );
    return observations.length
      ? [
          {
            ...event,
            observations,
            firstObservedAt: observations.reduce(
              (first, item) => (item.time < first ? item.time : first),
              observations[0].time,
            ),
          },
        ]
      : [];
  });
}

export function filterEvents(
  events,
  { categoryIds, query, minMagnitude, status },
) {
  const search = query.trim().toLocaleLowerCase();
  const minimum = minMagnitude === "" ? null : Number(minMagnitude);
  return events.filter((event) => {
    if (categoryIds && !event.categoryIds.some((id) => categoryIds.has(id)))
      return false;
    if (
      search &&
      !`${event.title} ${event.metadata?.place || ""}`
        .toLocaleLowerCase()
        .includes(search)
    )
      return false;
    if (
      event.source === "usgs" &&
      minimum != null &&
      (event.intensity.value == null || event.intensity.value < minimum)
    )
      return false;
    if (event.source === "eonet" && status !== "all" && event.status !== status)
      return false;
    return true;
  });
}
