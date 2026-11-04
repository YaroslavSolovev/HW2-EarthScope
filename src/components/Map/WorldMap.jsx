import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./WorldMap.module.css";

const ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/attribution/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const STAMEN_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/attribution/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const MAP_STYLES = [
  { id: "alidade_bright", name: "Яркая", attribution: ATTRIBUTION },
  { id: "outdoors", name: "Природная", attribution: ATTRIBUTION },
  { id: "stamen_terrain", name: "Рельефная", attribution: STAMEN_ATTRIBUTION },
  {
    id: "stamen_watercolor",
    name: "Акварельная",
    attribution: STAMEN_ATTRIBUTION,
    extension: "jpg",
  },
  { id: "alidade_smooth", name: "Спокойная", attribution: ATTRIBUTION },
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
        {drawable.map(({ event, observation }) => {
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
                L.circleMarker(latlng, {
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
                    `${event.source.toUpperCase()} · ${observation.time ? new Date(observation.time).toLocaleDateString() : "Date unknown"}`,
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
                  `Предыдущее наблюдение: ${new Date(observation.time).toLocaleDateString("ru-RU")}`,
                )
              }
            />
          );
        })}
        {selectedEvent && <FocusEvent event={selectedEvent} />}
      </MapContainer>
      <label className={styles.stylePicker}>
        <span>Вид карты</span>
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
