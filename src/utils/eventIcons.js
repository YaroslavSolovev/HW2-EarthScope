const KINDS = {
  earthquake: "earthquake",
  wildfires: "fire",
  fire: "fire",
  volcanoes: "volcano",
  severeStorms: "storm",
  floods: "flood",
  landslides: "landslide",
  drought: "drought",
  snow: "snow",
  seaLakeIce: "ice",
  "sea-and-lake-ice": "ice",
  dustHaze: "dust",
  tempExtremes: "temperature",
  "temperature-extremes": "temperature",
  "dust-and-haze": "dust",
  manmade: "manmade",
  waterColor: "water",
  "water-color": "water",
};

export function eventKind(event) {
  if (event?.source === "usgs" || event?.categoryIds?.includes("earthquake")) {
    return "earthquake";
  }
  return event?.categoryIds?.map((id) => KINDS[id]).find(Boolean) || "event";
}

const ICON_META = {
  earthquake: {
    label: "Earthquake",
    color: "#d94f6b",
    background: "#fff0f3",
    activeBackground: "#ffd6df",
    secondary: "#8f2e48",
  },
  fire: {
    label: "Wildfire",
    color: "#de672b",
    background: "#fff2e9",
    activeBackground: "#ffd9c5",
    secondary: "#ffb13b",
  },
  volcano: {
    label: "Volcanic eruption",
    color: "#8c4bb2",
    background: "#f5effb",
    activeBackground: "#e5d4f3",
    secondary: "#f08a3c",
  },
  storm: {
    label: "Severe storm",
    color: "#3b73bd",
    background: "#edf4ff",
    activeBackground: "#d6e5ff",
    secondary: "#87c5f2",
  },
  flood: {
    label: "Flood",
    color: "#16859e",
    background: "#e9f8fb",
    activeBackground: "#cceef4",
    secondary: "#54c4d2",
  },
  landslide: {
    label: "Landslide",
    color: "#8b6b45",
    background: "#f7f1eb",
    activeBackground: "#eadbca",
    secondary: "#c7a36c",
  },
  drought: {
    label: "Drought",
    color: "#bb861a",
    background: "#fff8e6",
    activeBackground: "#ffecb3",
    secondary: "#f0c64e",
  },
  snow: {
    label: "Snow",
    color: "#4a8fc6",
    background: "#edf7ff",
    activeBackground: "#d7edff",
    secondary: "#9bd4f4",
  },
  ice: {
    label: "Sea and lake ice",
    color: "#3f90ad",
    background: "#eaf8fb",
    activeBackground: "#cbeef5",
    secondary: "#8ed7e6",
  },
  temperature: {
    label: "Temperature extreme",
    color: "#cf4b61",
    background: "#fff0f2",
    activeBackground: "#ffd6dd",
    secondary: "#f08b63",
  },
  dust: {
    label: "Dust and haze",
    color: "#98795b",
    background: "#f7f1eb",
    activeBackground: "#eadbc9",
    secondary: "#c9ae85",
  },
  manmade: {
    label: "Manmade event",
    color: "#66758a",
    background: "#f0f3f6",
    activeBackground: "#dce4ec",
    secondary: "#aab7c5",
  },
  water: {
    label: "Water color",
    color: "#2b8d9b",
    background: "#e9f8f9",
    activeBackground: "#c9edef",
    secondary: "#76d4dc",
  },
  event: {
    label: "Natural event",
    color: "#52778d",
    background: "#eef5f8",
    activeBackground: "#d8e8ef",
    secondary: "#8db6c5",
  },
};

export function eventIconMeta(event) {
  return ICON_META[eventKind(event)];
}

export function eventIconLabel(event) {
  return eventIconMeta(event).label;
}

const PATHS = {
  earthquake: '<path d="M3 13h4l2-6 3 10 2-6h7"/>',
  fire: '<path d="M12 21c4 0 7-2.5 7-6.1 0-2.7-1.5-4.8-3.7-6.4.1 2-1 3.4-2.5 4.2.2-3.7-1.4-6-3.4-7.7C9.4 8.6 7 11.6 7 15c0 3.6 2.3 6 5 6Z"/>',
  volcano:
    '<path d="m4 20 5-9 3 4 3-5 5 10M8 10c1-1 1-2 0-3m4 2c1-1 1-2 0-3"/>',
  storm:
    '<path d="M6 17h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1A3.5 3.5 0 0 0 6 17Z"/><path d="m12 12-2 4h3l-1 4 4-6h-3l1-2"/>',
  flood:
    '<path d="M3 9c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2M3 15c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2"/>',
  landslide: '<path d="m3 20 7-11 3 5 2-3 6 9M7 14l-2-2m11 3 2-2"/>',
  drought:
    '<circle cx="12" cy="9" r="3"/><path d="M12 2v2m0 10v2M5 9H3m18 0h-2M7 4 5.5 2.5m11 3L18 4M5 20l5-4 3 3 6-5"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M8 4l4 3 4-3M8 20l4-3 4 3"/>',
  ice: '<path d="m12 3 7 7-7 11-7-11 7-7Z"/><path d="m8 11 4 2 4-2"/>',
  temperature:
    '<path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z"/><path d="M12 7v8"/>',
  dust: '<path d="M4 9h9M2 13h14M5 17h7"/><circle cx="18" cy="7" r="2"/><circle cx="20" cy="15" r="1"/>',
  manmade:
    '<path d="M4 20V9l5 3V7l5 3V5l6 3v12H4Z"/><path d="M8 16h2m3 0h2m3 0h1"/>',
  water: '<path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/>',
  event:
    '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2 2 3 5 3 8s-1 6-3 8c-2-2-3-5-3-8s1-6 3-8Z"/>',
};

const CINEMATIC_PATHS = {
  earthquake:
    '<path d="M2 6h8l2 5-2 8H2Z" fill="SECONDARY" stroke="PRIMARY"/><path d="M22 18h-8l-2-7 2-5h8Z" fill="PRIMARY" stroke="PRIMARY"/><path d="m12 2-2 6 3 3-3 5 2 6" stroke="#fff" stroke-width="2.2"/><path d="M4 12h3m13-3h-3M4 17l3-1m10 2 3 1" stroke="#fff" stroke-width="1"/><path d="m7 5 2 2m8 10 2 2" stroke="#f2b15b" stroke-width="1.4"/>',
  fire: '<path d="M12 21c4 0 7-2.5 7-6.1 0-2.8-1.5-4.8-3.7-6.4.1 2-1 3.4-2.5 4.2.2-3.7-1.4-6-3.4-7.7C9.4 8.6 7 11.6 7 15c0 3.6 2.3 6 5 6Z" fill="PRIMARY" stroke="PRIMARY"/><path d="M12 18c1.8 0 3-1.2 3-2.8 0-1-.4-1.8-1.2-2.6 0 1-.6 1.6-1.2 2-.1-1.4-.7-2.3-1.5-3.2-.7 1.2-1.4 2.4-1.4 3.7 0 1.7 1 2.9 2.3 2.9Z" fill="SECONDARY"/><circle cx="8" cy="5" r="1.2" fill="#d4a98b"/><circle cx="16" cy="4" r="1" fill="#d4a98b"/>',
  volcano:
    '<path d="m3 20 7-12 3 5 2-3 6 10H3Z" fill="PRIMARY" stroke="PRIMARY"/><path d="m10 8 2 5 2-3 2 3-3 1-3-3Z" fill="#f2e5fb" stroke="#fff"/><path d="M13 14c0 3 1 4 1 6h3l-1-3 2-2" fill="SECONDARY" stroke="SECONDARY"/><circle cx="8" cy="5" r="2" fill="SECONDARY"/><circle cx="12" cy="3" r="1.6" fill="#c99de3"/><circle cx="15.5" cy="5" r="1.4" fill="#b7a2c4"/><path d="m9 7 1-2m3 0 1-2" stroke="#fff"/>',
  storm:
    '<path d="M5 17h12a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5 1A3.5 3.5 0 0 0 5 17Z" fill="PRIMARY" stroke="PRIMARY"/><path d="m13 11-2 4h3l-1 4 4-6h-3l1-2Z" fill="SECONDARY" stroke="#fff"/><path d="M7 20v2m4-2v2m4-2v2" stroke="#8fc9f2"/>',
  flood:
    '<path d="M4 8h8v7H4Z" fill="#fff" stroke="PRIMARY"/><path d="m4 8 4-3 4 3" fill="SECONDARY" stroke="PRIMARY"/><path d="M7 10h2v3H7Z" fill="#f1c35a" stroke="PRIMARY"/><path d="M3 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2v6H3Z" fill="PRIMARY" stroke="PRIMARY"/><path d="M3 17c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" stroke="SECONDARY"/><path d="m6 3 1 2m5-3 1 3m5-2-1 2" stroke="#6fbad0" stroke-width="1.2"/>',
  landslide:
    '<path d="m3 20 7-12 3 5 2-3 6 10H3Z" fill="PRIMARY" stroke="PRIMARY"/><path d="m10 8 2 5 2-3 2 3-3 1-3-3Z" fill="#f3e4ce" stroke="#fff"/><circle cx="18" cy="17" r="2" fill="SECONDARY"/><circle cx="6" cy="15" r="1.4" fill="SECONDARY"/>',
  drought:
    '<circle cx="12" cy="9" r="4" fill="SECONDARY" stroke="PRIMARY"/><path d="M12 2v2m0 12v2M5 9H3m18 0h-2M7 4 5.5 2.5m11 3L18 4" stroke="PRIMARY"/><path d="M4 21h16M6 21l4-5 3 3 5-6" stroke="PRIMARY"/>',
  snow: '<path d="M12 3v18M4 8l16 8M4 16 20 8M8 4l4 3 4-3M8 20l4-3 4 3" stroke="PRIMARY"/><circle cx="12" cy="12" r="3" fill="SECONDARY" stroke="PRIMARY"/>',
  ice: '<path d="m12 3 7 7-7 11-7-11 7-7Z" fill="SECONDARY" stroke="PRIMARY"/><path d="m8 11 4 2 4-2" stroke="#fff"/><path d="M12 3v20" stroke="#fff"/>',
  temperature:
    '<path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" fill="SECONDARY" stroke="PRIMARY"/><path d="M12 7v8" stroke="#fff"/><path d="M16 5h3m-3 4h2" stroke="PRIMARY"/>',
  dust: '<path d="M4 9h13a4 4 0 0 1 0 8H6a4 4 0 0 1-2-8Z" fill="SECONDARY" stroke="PRIMARY"/><path d="M2 13h5m-2 5h5m5-11h4" stroke="#fff"/><circle cx="19" cy="5" r="1.5" fill="PRIMARY"/>',
  manmade:
    '<path d="M4 20V9l5 3V7l5 3V5l6 3v12H4Z" fill="SECONDARY" stroke="PRIMARY"/><path d="M8 16h2m3 0h2m3 0h1" stroke="#fff"/>',
  water:
    '<path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z" fill="SECONDARY" stroke="PRIMARY"/><path d="M9 15c1 2 3 2 5 1" stroke="#fff"/>',
  event:
    '<circle cx="12" cy="12" r="8" fill="SECONDARY" stroke="PRIMARY"/><path d="M4 12h16M12 4c2 2 3 5 3 8s-1 6-3 8c-2-2-3-5-3-8s1-6 3-8Z" stroke="#fff"/>',
};

export function eventIconSvg(event, size = 20, color = "currentColor") {
  const kind = eventKind(event);
  const meta = eventIconMeta(event);
  const primary = color === "currentColor" ? meta.color : color;
  const markup = (CINEMATIC_PATHS[kind] || CINEMATIC_PATHS.event)
    .replaceAll("PRIMARY", primary)
    .replaceAll("SECONDARY", meta.secondary);
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
}
