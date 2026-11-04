export function normalizeEonetResponse(d) {
  return (d?.events || [])
    .filter((e) => e?.id)
    .map((e) => ({
      id: "eonet:" + e.id,
      source: "eonet",
      categoryIds: (e.categories || []).map((c) => c.id).filter(Boolean),
      title: e.title || "Unnamed event",
      firstObservedAt: e.geometry?.[0]?.date || e.closed || null,
      closedAt: e.closed || null,
      observations: (e.geometry || [])
        .filter((g) => Array.isArray(g.coordinates))
        .map((g) => ({
          time: g.date || null,
          geometry: { type: g.type, coordinates: g.coordinates },
        })),
      intensity: { value: null, unit: null, kind: null, scale: null },
      metadata: { place: null, depthKm: null },
      status: e.closed ? "closed" : "open",
      sourceUrl: e.sources?.[0]?.url || null,
    }));
}
export function normalizeEonetCategories(d) {
  return (d?.categories || [])
    .filter((c) => c?.id)
    .map((c) => ({ id: c.id, title: c.title || c.id }));
}
