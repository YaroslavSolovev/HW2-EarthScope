export function normalizeUsgsResponse(d) {
  return (Array.isArray(d?.features) ? d.features : [])
    .filter((f) => {
      if (f?.geometry?.type !== "Point") return false;
      const [lon, lat] = f.geometry.coordinates || [];
      return (
        Number.isFinite(lon) &&
        Number.isFinite(lat) &&
        Math.abs(lon) <= 180 &&
        Math.abs(lat) <= 90
      );
    })
    .map((f) => {
      const [lon, lat, depth] = f.geometry.coordinates || [];
      const p = f.properties || {};
      const time =
        Number.isFinite(p.time) && !Number.isNaN(new Date(p.time).getTime())
          ? new Date(p.time).toISOString()
          : null;
      return {
        id: "usgs:" + (f.id || p.code || lon + ":" + lat),
        source: "usgs",
        categoryIds: ["earthquake"],
        title: p.place || "Earthquake",
        firstObservedAt: time,
        closedAt: null,
        observations: [
          { time, geometry: { type: "Point", coordinates: [lon, lat] } },
        ],
        intensity: {
          value: Number.isFinite(p.mag) ? p.mag : null,
          unit: null,
          kind: "earthquake-magnitude",
          scale: p.magType || null,
        },
        metadata: {
          depthKm: Number.isFinite(depth) ? depth : null,
          place: p.place || null,
        },
        status: "unknown",
        sourceUrl: p.url || null,
      };
    });
}
