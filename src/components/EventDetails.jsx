import React from "react";
import { getLatestObservation } from "./Map/WorldMap.jsx";
import EventIcon from "./EventIcon.jsx";
import styles from "./EventDetails.module.css";

function dateText(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC";
}

export default function EventDetails({ event, categories, onClose }) {
  if (!event) return null;

  const names = event.categoryIds.map((id) =>
    id === "earthquake"
      ? "Earthquake"
      : categories.find((item) => item.id === id)?.title || id,
  );
  const latest = getLatestObservation(event);

  return (
    <section className={styles.card} aria-label="Event details">
      <div className={styles.top}>
        <span className={styles.source}>{event.source.toUpperCase()}</span>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Close event details"
        >
          ×
        </button>
      </div>
      <div className={styles.titleRow}>
        <EventIcon event={event} size={24} active />
        <h2>{event.title}</h2>
      </div>
      <p className={styles.categories}>
        {names.join(" · ") || "Unknown category"}
      </p>
      <dl className={styles.fields}>
        <div>
          <dt>First observation</dt>
          <dd>{dateText(event.firstObservedAt)}</dd>
        </div>
        <div>
          <dt>Latest observation</dt>
          <dd>{dateText(latest?.time)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            {event.status === "unknown"
              ? "Unknown"
              : event.status === "open"
                ? "Open"
                : "Closed"}
          </dd>
        </div>
        {event.intensity?.value != null && (
          <div>
            <dt>Magnitude</dt>
            <dd>
              {event.intensity.value} {event.intensity.scale || ""}
            </dd>
          </div>
        )}
        {event.metadata?.depthKm != null && (
          <div>
            <dt>Depth</dt>
            <dd>{event.metadata.depthKm} km</dd>
          </div>
        )}
      </dl>
      <p className={styles.note}>
        Dated geometries:{" "}
        {event.observations.filter((item) => item.time).length}
      </p>
      {event.source === "eonet" && (
        <p className={styles.note}>
          00:00 UTC may mean that the source provided a date without an exact
          time.
        </p>
      )}
      {event.sourceUrl && (
        <a
          className={styles.link}
          href={event.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open source record ↗
        </a>
      )}
    </section>
  );
}
