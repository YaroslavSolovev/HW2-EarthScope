export function mergeEvents(events) {
  const byId = new Map();
  for (const event of events) {
    const previous = byId.get(event.id);
    if (!previous) {
      byId.set(event.id, event);
      continue;
    }
    const observations = [...previous.observations, ...event.observations];
    const unique = new Map(
      observations.map((item) => [
        `${item.time}:${JSON.stringify(item.geometry)}`,
        item,
      ]),
    );
    const combined = [...unique.values()].sort((a, b) =>
      (a.time || "").localeCompare(b.time || ""),
    );
    byId.set(event.id, {
      ...previous,
      categoryIds: [
        ...new Set([...previous.categoryIds, ...event.categoryIds]),
      ],
      observations: combined,
      firstObservedAt: combined[0]?.time || previous.firstObservedAt,
    });
  }
  return [...byId.values()];
}
