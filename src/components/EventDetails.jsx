import React from "react";
import { getLatestObservation } from "./Map/WorldMap.jsx";
import styles from "./EventDetails.module.css";

function dateText(value) {
  if (!value) return "Дата неизвестна";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Дата неизвестна"
    : date.toLocaleString("ru-RU", { timeZone: "UTC" }) + " UTC";
}

export default function EventDetails({ event, categories, onClose }) {
  if (!event) return null;

  const names = event.categoryIds.map((id) =>
    id === "earthquake"
      ? "Землетрясение"
      : categories.find((item) => item.id === id)?.title || id,
  );
  const latest = getLatestObservation(event);

  return (
    <section className={styles.card} aria-label="Подробности события">
      <div className={styles.top}>
        <span className={styles.source}>{event.source.toUpperCase()}</span>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Закрыть карточку"
        >
          ×
        </button>
      </div>
      <h2>{event.title}</h2>
      <p className={styles.categories}>
        {names.join(" · ") || "Категория неизвестна"}
      </p>
      <dl className={styles.fields}>
        <div>
          <dt>Первое наблюдение</dt>
          <dd>{dateText(event.firstObservedAt)}</dd>
        </div>
        <div>
          <dt>Последнее наблюдение</dt>
          <dd>{dateText(latest?.time)}</dd>
        </div>
        <div>
          <dt>Статус</dt>
          <dd>
            {event.status === "unknown"
              ? "Неизвестен"
              : event.status === "open"
                ? "Открыто"
                : "Закрыто"}
          </dd>
        </div>
        {event.intensity?.value != null && (
          <div>
            <dt>Магнитуда</dt>
            <dd>
              {event.intensity.value} {event.intensity.scale || ""}
            </dd>
          </div>
        )}
        {event.metadata?.depthKm != null && (
          <div>
            <dt>Глубина</dt>
            <dd>{event.metadata.depthKm} км</dd>
          </div>
        )}
      </dl>
      <p className={styles.note}>
        Датированных геометрий:{" "}
        {event.observations.filter((item) => item.time).length}
      </p>
      {event.source === "eonet" && (
        <p className={styles.note}>
          Время 00:00 UTC может означать, что источник указал только дату.
        </p>
      )}
      {event.sourceUrl && (
        <a
          className={styles.link}
          href={event.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Открыть запись источника ↗
        </a>
      )}
    </section>
  );
}
