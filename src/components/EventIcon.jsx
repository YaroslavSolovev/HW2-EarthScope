import React from "react";
import {
  eventIconLabel,
  eventIconMeta,
  eventIconSvg,
} from "../utils/eventIcons.js";

export default function EventIcon({ event, size = 21, active = false }) {
  const meta = eventIconMeta(event);
  return (
    <span
      className={`eventIcon${active ? " eventIconActive" : ""}`}
      aria-label={eventIconLabel(event)}
      title={eventIconLabel(event)}
      style={{
        "--icon-color": meta.color,
        "--icon-bg": meta.background,
        "--icon-active-bg": meta.activeBackground,
      }}
      dangerouslySetInnerHTML={{ __html: eventIconSvg(event, size) }}
    />
  );
}
