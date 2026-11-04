import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./WorldMap.module.css";

const ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/attribution/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function Basemap() {
  const [fallback, setFallback] = useState(false);
  return fallback ? (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
  ) : (
    <TileLayer
      url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      attribution={ATTRIBUTION}
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

export default function WorldMap({
  events = [],
  selectedEvent = null,
  onSelectEvent,
}) {
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
        <Basemap />
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
                  color: "#0b1422",
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
        {selectedEvent && <FocusEvent event={selectedEvent} />}
      </MapContainer>
    </div>
  );
}
