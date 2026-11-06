import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  CircleMarker,
  GeoJSON,
  Marker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./WorldMap.module.css";
import {
  eventIconLabel,
  eventIconMeta,
  eventIconSvg,
} from "../../utils/eventIcons.js";

const ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/attribution/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const STAMEN_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/attribution/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const MAP_STYLES = [
  { id: "alidade_bright", name: "Bright", attribution: ATTRIBUTION },
  { id: "outdoors", name: "Outdoors", attribution: ATTRIBUTION },
  { id: "stamen_terrain", name: "Terrain", attribution: STAMEN_ATTRIBUTION },
  {
    id: "stamen_watercolor",
    name: "Watercolor",
    attribution: STAMEN_ATTRIBUTION,
    extension: "jpg",
  },
  { id: "alidade_smooth", name: "Smooth", attribution: ATTRIBUTION },
];

function Basemap({ style }) {
  const [fallback, setFallback] = useState(false);
  const extension = style.extension || "png";
  return fallback ? (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
  ) : (
    <TileLayer
      url={`https://tiles.stadiamaps.com/tiles/${style.id}/{z}/{x}/{y}${extension === "jpg" ? "" : "{r}"}.${extension}`}
      attribution={style.attribution}
      eventHandlers={{ tileerror: () => setFallback(true) }}
    />
  );
}

export function getLatestObservation(event) {
  const observations =
    event.observations?.filter(
      (item) =>
        item?.geometry?.type && Array.isArray(item.geometry.coordinates),
    ) || [];
  return observations.reduce(
    (latest, item) =>
      !latest || (item.time || "") > (latest.time || "") ? item : latest,
    null,
  );
}

function eventColor(event) {
  if (event.source === "usgs") return "#fb7185";
  const palette = [
    "#fbbf24",
    "#a78bfa",
    "#34d399",
    "#38bdf8",
    "#fb923c",
    "#f472b6",
  ];
  const id = event.categoryIds?.[0] || event.id;
  const hash = [...id].reduce((value, char) => value + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function eventMarkerIcon(event, active = false) {
  const meta = eventIconMeta(event);
  return L.divIcon({
    className: `${styles.eventMarker} ${active ? styles.eventMarkerActive : ""}`,
    html: `<span title="${eventIconLabel(event)}" style="--marker-color:${meta.color};--marker-bg:${active ? meta.activeBackground : meta.background}">${eventIconSvg(event, 24, meta.color)}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function FocusEvent({ event }) {
  const map = useMap();
  useEffect(() => {
    const geometry = getLatestObservation(event)?.geometry;
    if (!geometry) return;
    const bounds = L.geoJSON({
      type: "Feature",
      geometry,
      properties: {},
    }).getBounds();
    if (bounds.isValid())
      map.flyToBounds(bounds.pad(0.8), { maxZoom: 6, duration: 0.7 });
  }, [event, map]);
  return null;
}

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function ClusteredPoints({ points, onSelectEvent }) {
  const map = useMap();
  const [view, setView] = useState(0);
  useMapEvents({
    moveend: () => setView((value) => value + 1),
    zoomend: () => setView((value) => value + 1),
  });

  const groups = useMemo(() => {
    const cells = new Map();
    const bounds = map.getBounds().pad(0.2);
    const zoom = map.getZoom();
    for (const item of points) {
      const [lon, lat] = item.observation.geometry.coordinates;
      const position = L.latLng(lat, lon);
      if (!bounds.contains(position)) continue;
      const pixel = map.project(position, zoom);
      const key = `${Math.floor(pixel.x / 70)}:${Math.floor(pixel.y / 70)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(item);
    }
    return [...cells.entries()].map(([key, items]) => {
      const [x, y] = key.split(":").map(Number);
      const center = map.unproject(
        L.point((x + 0.5) * 70, (y + 0.5) * 70),
        zoom,
      );
      return { key, items, center };
    });
  }, [points, map, view]);

  return groups.map(({ key, items, center }) => {
    const first = items[0];
    const [lon, lat] = first.observation.geometry.coordinates;
    const clustered = items.length > 1;
    const color = clustered ? "#247cba" : eventColor(first.event);
    const position = clustered ? center : [lat, lon];
    if (!clustered) {
      return (
        <Marker
          key={key}
          position={position}
          icon={eventMarkerIcon(first.event)}
          eventHandlers={{ click: () => onSelectEvent?.(first.event) }}
        >
          <Tooltip direction="top">{first.event.title}</Tooltip>
        </Marker>
      );
    }
    return (
      <CircleMarker
        key={key}
        center={position}
        radius={clustered ? Math.min(26, 12 + Math.log2(items.length) * 3) : 6}
        pathOptions={{
          color: "#fff",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95,
        }}
        eventHandlers={{
          click: () =>
            clustered
              ? map.setView(
                  position,
                  Math.min(map.getZoom() + 2, map.getMaxZoom()),
                )
              : onSelectEvent?.(first.event),
        }}
      >
        <Tooltip
          permanent={clustered}
          direction={clustered ? "center" : "top"}
          className={clustered ? styles.clusterCount : undefined}
        >
          {clustered ? items.length : first.event.title}
        </Tooltip>
      </CircleMarker>
    );
  });
}

export default function WorldMap({
  events = [],
  selectedEvent = null,
  onSelectEvent,
}) {
  const [styleId, setStyleId] = useState("alidade_bright");
  const mapStyle = MAP_STYLES.find((item) => item.id === styleId);
  const drawable = useMemo(
    () =>
      events
        .map((event) => ({ event, observation: getLatestObservation(event) }))
        .filter((item) => item.observation),
    [events],
  );
  const points = useMemo(
    () =>
      drawable.filter(
        ({ event, observation }) =>
          observation.geometry.type === "Point" &&
          event.id !== selectedEvent?.id,
      ),
    [drawable, selectedEvent],
  );
  const shapes = useMemo(
    () =>
      drawable.filter(
        ({ event, observation }) =>
          observation.geometry.type !== "Point" ||
          event.id === selectedEvent?.id,
      ),
    [drawable, selectedEvent],
  );

  return (
    <div className={styles.map}>
      <MapContainer
        center={[18, 8]}
        zoom={2}
        minZoom={2}
        maxZoom={16}
        worldCopyJump
        className={styles.leaflet}
      >
        <Basemap key={styleId} style={mapStyle} />
        <ResizeMap />
        <ClusteredPoints points={points} onSelectEvent={onSelectEvent} />
        {shapes.map(({ event, observation }) => {
          const color = eventColor(event);
          const selected = selectedEvent?.id === event.id;
          return (
            <GeoJSON
              key={`${event.id}:${observation.time || ""}:${selected}`}
              data={{
                type: "Feature",
                properties: {},
                geometry: observation.geometry,
              }}
              style={{
                color,
                weight: selected ? 3 : 2,
                fillColor: color,
                fillOpacity: selected ? 0.4 : 0.2,
              }}
              pointToLayer={(_, latlng) =>
                selected && observation.geometry.type === "Point"
                  ? L.marker(latlng, {
                      icon: eventMarkerIcon(event, true),
                    })
                  : L.circleMarker(latlng, {
                      radius: selected ? 9 : 6,
                      color: "#ffffff",
                      weight: 2,
                      fillColor: color,
                      fillOpacity: 0.95,
                    })
              }
              onEachFeature={(_, layer) => {
                const content = document.createElement("div");
                const title = document.createElement("strong");
                title.textContent = event.title;
                content.append(title, document.createElement("br"));
                content.append(
                  document.createTextNode(
                    `${event.source.toUpperCase()} · ${observation.time ? new Date(observation.time).toLocaleDateString("en-GB") : "Date unknown"}`,
                  ),
                );
                layer.bindPopup(content);
                layer.on("click", () => onSelectEvent?.(event));
              }}
            />
          );
        })}
        {selectedEvent?.observations.map((observation, index) => {
          if (observation === getLatestObservation(selectedEvent)) return null;
          return (
            <GeoJSON
              key={`${selectedEvent.id}:old:${index}`}
              data={{
                type: "Feature",
                properties: {},
                geometry: observation.geometry,
              }}
              style={{
                color: "#f1f5f9",
                weight: 1,
                dashArray: "4 4",
                fillOpacity: 0.08,
              }}
              pointToLayer={(_, latlng) =>
                L.circleMarker(latlng, {
                  radius: 4,
                  color: "#f1f5f9",
                  fillColor: "#94a3b8",
                  fillOpacity: 0.7,
                })
              }
              onEachFeature={(_, layer) =>
                layer.bindPopup(
                  `Previous observation: ${new Date(observation.time).toLocaleDateString("en-GB")}`,
                )
              }
            />
          );
        })}
        {selectedEvent && <FocusEvent event={selectedEvent} />}
      </MapContainer>
      <label className={styles.stylePicker}>
        <span>Map style</span>
        <select
          value={styleId}
          onChange={(event) => setStyleId(event.target.value)}
        >
          {MAP_STYLES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
