import React, { useEffect, useRef, useState } from "react";
import WorldMap from "./components/Map/WorldMap.jsx";
import { fetchUsgsEarthquakes } from "./api/usgs.js";
import { fetchEonetCategories, fetchEonetEvents } from "./api/eonet.js";

export default function App() {
  const [usgs, setUsgs] = useState([]);
  const [nasa, setNasa] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const request = useRef(null);

  async function loadData() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setErrors({});

    const results = await Promise.allSettled([
      fetchUsgsEarthquakes({ signal: controller.signal }),
      fetchEonetEvents({ signal: controller.signal }),
      fetchEonetCategories({ signal: controller.signal }),
    ]);

    if (controller.signal.aborted) return;

    const [usgsResult, nasaResult, categoryResult] = results;
    setUsgs(usgsResult.status === "fulfilled" ? usgsResult.value : []);
    setNasa(nasaResult.status === "fulfilled" ? nasaResult.value : []);
    setCategories(
      categoryResult.status === "fulfilled" ? categoryResult.value : [],
    );
    setErrors({
      ...(usgsResult.status === "rejected" && {
        usgs: usgsResult.reason.message,
      }),
      ...(nasaResult.status === "rejected" && {
        nasa: nasaResult.reason.message,
      }),
      ...(categoryResult.status === "rejected" && {
        categories: categoryResult.reason.message,
      }),
    });
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    return () => request.current?.abort();
  }, []);

  const events = [...usgs, ...nasa].sort((a, b) =>
    (b.firstObservedAt || "").localeCompare(a.firstObservedAt || ""),
  );

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="brand">EarthScope</div>
          <div className="sub">Global Natural Events Explorer</div>
        </div>
        <div className="badge">● LIVE DATA</div>
      </header>

      <div className="body">
        <aside className="side">
          <h2>DATA SOURCES</h2>
          <div className="status">
            <span className="pill">USGS · {usgs.length}</span>
            <span className="pill">NASA · {nasa.length}</span>
          </div>
          <p className="muted">{categories.length} NASA categories available</p>
          {loading && <p className="muted">Loading latest events…</p>}
          {Object.entries(errors).map(([source, message]) => (
            <p className="error" key={source}>
              {source}: {message}
            </p>
          ))}
          <button className="retry" onClick={loadData} disabled={loading}>
            Reload data
          </button>

          <h2 style={{ marginTop: 28 }}>RECENT EVENTS</h2>
          {!loading && events.length === 0 && (
            <p className="muted">No events available.</p>
          )}
          {events.slice(0, 8).map((event) => (
            <button
              className="eventButton"
              key={event.id}
              onClick={() => setSelected(event)}
              aria-pressed={selected?.id === event.id}
            >
              <strong>{event.title}</strong>
              <span>
                {event.source.toUpperCase()} ·{" "}
                {event.firstObservedAt
                  ? new Date(event.firstObservedAt).toLocaleDateString()
                  : "Date unknown"}
              </span>
            </button>
          ))}
        </aside>

        <main className="main">
          <div className="mapwrap">
            <WorldMap
              events={events}
              selectedEvent={selected}
              onSelectEvent={setSelected}
            />
          </div>
          <div className="timeline">
            Timeline Player · available in a later stage
          </div>
        </main>
      </div>
    </div>
  );
}
