function validPoint(point) {
  return (
    Array.isArray(point) &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    Math.abs(point[0]) <= 180 &&
    Math.abs(point[1]) <= 90
  );
}

function validGeometry(geometry) {
  if (geometry?.type === "Point") return validPoint(geometry.coordinates);
  if (geometry?.type === "Polygon") {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length > 0 &&
      geometry.coordinates.every(
        (ring) =>
          Array.isArray(ring) && ring.length >= 4 && ring.every(validPoint),
      )
    );
  }
  return false;
}

export function normalizeEonetResponse(d) {
  return (Array.isArray(d?.events) ? d.events : [])
    .filter(
      (e) =>
        e?.id &&
        !(
          Array.isArray(e.categories) &&
          e.categories.some(
            (c) => c?.id === "earthquakes" || c?.id === "earthquake",
          )
        ),
    )
    .map((e) => {
      const observations = (Array.isArray(e.geometry) ? e.geometry : [])
        .filter(
          (g) =>
            validGeometry(g) &&
            g.date &&
            !Number.isNaN(new Date(g.date).getTime()),
        )
        .map((g) => ({
          time: new Date(g.date).toISOString(),
          geometry: { type: g.type, coordinates: g.coordinates },
        }));
      const firstObservedAt = observations.length
        ? observations.reduce(
            (first, item) => (item.time < first ? item.time : first),
            observations[0].time,
          )
        : null;
      return {
        id: "eonet:" + e.id,
        source: "eonet",
        categoryIds: (Array.isArray(e.categories) ? e.categories : [])
          .map((c) => c?.id)
          .filter(Boolean),
        title: e.title || "Unnamed event",
        firstObservedAt,
        closedAt: e.closed || null,
        observations,
        intensity: { value: null, unit: null, kind: null, scale: null },
        metadata: { place: null, depthKm: null },
        status: e.closed ? "closed" : "open",
        sourceUrl: e.link || e.sources?.[0]?.url || null,
      };
    });
}
export function normalizeEonetCategories(d) {
  return (Array.isArray(d?.categories) ? d.categories : [])
    .filter((c) => c?.id)
    .map((c) => ({ id: c.id, title: c.title || c.id }));
}
