import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import WorldMap from "./components/Map/WorldMap.jsx";
import EventDetails from "./components/EventDetails.jsx";
import EventIcon from "./components/EventIcon.jsx";
import { fetchUsgsEarthquakes, fetchUsgsHistory } from "./api/usgs.js";
import {
  fetchEonetCategories,
  fetchEonetEvents,
  fetchEonetHistory,
} from "./api/eonet.js";
import {
  eventsInPeriod,
  filterEvents,
  latestTime,
  validateHistoryDates,
} from "./utils/filters.js";
import {
  eventsAtReplayTime,
  minimumReplaySeconds,
  replayStats,
  replayTime,
} from "./utils/replay.js";

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days) =>
  new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

export default function App() {
  const [mode, setMode] = useState("live");
  const [liveDays, setLiveDays] = useState(7);
  const [start, setStart] = useState(daysAgo(6));
  const [end, setEnd] = useState(today());
  const [range, setRange] = useState(null);
  const [dateError, setDateError] = useState("");
  const [usgs, setUsgs] = useState([]);
  const [nasa, setNasa] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected] = useState(null);
  const [chosenCategories, setChosenCategories] = useState(null);
  const [query, setQuery] = useState("");
  const [minMagnitude, setMinMagnitude] = useState("");
  const [status, setStatus] = useState("all");
  const [visibleCount, setVisibleCount] = useState(50);
  const [replayProgress, setReplayProgress] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySeconds, setReplaySeconds] = useState(20);
  const animationFrame = useRef(null);
  const replayStartedAt = useRef(0);
  const replayStartProgress = useRef(0);
  const request = useRef(null);

  const replayMinimum = useMemo(() => minimumReplaySeconds(range), [range]);

  const loadData = useCallback(async () => {
    request.current?.abort();
    if (mode === "history" && !range) {
      setUsgs([]);
      setNasa([]);
      setErrors({});
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setErrors({});
    const options = { signal: controller.signal };
    const tasks =
      mode === "live"
        ? [
            fetchUsgsEarthquakes({ ...options, days: liveDays }),
            fetchEonetEvents({ ...options, days: liveDays }),
          ]
        : [
            fetchUsgsHistory({ ...options, ...range }),
            fetchEonetHistory({ ...options, ...range }),
          ];
    const [usgsResult, nasaResult, categoryResult] = await Promise.allSettled([
      ...tasks,
      fetchEonetCategories(options),
    ]);
    if (controller.signal.aborted) return;

    setUsgs(usgsResult.status === "fulfilled" ? usgsResult.value : []);
    setNasa(nasaResult.status === "fulfilled" ? nasaResult.value : []);
    if (categoryResult.status === "fulfilled")
      setCategories(categoryResult.value);
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
    if (
      usgsResult.status === "fulfilled" ||
      nasaResult.status === "fulfilled"
    ) {
      setLastUpdated(new Date());
    } else {
      setLastUpdated(null);
    }
    setLoading(false);
  }, [mode, liveDays, range]);

  useEffect(() => {
    loadData();
    return () => request.current?.abort();
  }, [loadData]);

  useEffect(() => {
    if (mode !== "live") return;
    const timer = setInterval(loadData, 120000);
    return () => clearInterval(timer);
  }, [mode, loadData]);

  useEffect(() => {
    setReplaySeconds((value) => Math.max(value, replayMinimum));
  }, [replayMinimum]);

  useEffect(() => {
    if (!replayPlaying || mode !== "history" || !range) return undefined;

    replayStartedAt.current = performance.now();
    replayStartProgress.current = replayProgress;
    const frame = (now) => {
      const passed = (now - replayStartedAt.current) / 1000;
      const next = replayStartProgress.current + passed / replaySeconds;
      if (next >= 1) {
        setReplayProgress(1);
        setReplayPlaying(false);
        return;
      }
      setReplayProgress(next);
      animationFrame.current = requestAnimationFrame(frame);
    };
    animationFrame.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [replayPlaying, replaySeconds, mode, range]);

  const allCategories = useMemo(
    () => [
      { id: "earthquake", title: "Earthquakes" },
      ...categories.filter(
        (item) => item.id !== "earthquake" && item.id !== "earthquakes",
      ),
    ],
    [categories],
  );

  const events = useMemo(() => {
    const inPeriod = eventsInPeriod([...usgs, ...nasa], mode, liveDays, range);
    return filterEvents(inPeriod, {
      categoryIds: chosenCategories,
      query,
      minMagnitude,
      status,
    }).sort((a, b) => latestTime(b).localeCompare(latestTime(a)));
  }, [
    usgs,
    nasa,
    mode,
    liveDays,
    range,
    chosenCategories,
    query,
    minMagnitude,
    status,
  ]);

  const replayEvents = useMemo(
    () => eventsAtReplayTime(events, replayTime(range, replayProgress)),
    [events, range, replayProgress],
  );
  const mapEvents = mode === "history" && range ? replayEvents : events;
  const replayDate = replayTime(range, replayProgress);
  const replayEventStats = replayStats(replayEvents);

  const selectedEvent =
    events.find((event) => event.id === selected?.id) || null;
  const shown = events.slice(0, visibleCount);

  function toggleCategory(id) {
    const next =
      chosenCategories === null
        ? new Set(allCategories.map((item) => item.id))
        : new Set(chosenCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChosenCategories(next);
    setVisibleCount(50);
  }

  function clearResults() {
    setUsgs([]);
    setNasa([]);
    setLastUpdated(null);
    setSelected(null);
    setVisibleCount(50);
    setReplayPlaying(false);
    setReplayProgress(0);
  }

  function toggleReplay() {
    if (!range || !events.length) return;
    if (replayProgress >= 1) setReplayProgress(0);
    setReplayPlaying((value) => !value);
  }

  function submitHistory(event) {
    event.preventDefault();
    const error = validateHistoryDates(start, end);
    setDateError(error || "");
    if (!error) {
      if (range?.start === start && range?.end === end) {
        loadData();
      } else {
        clearResults();
        setRange({ start, end });
      }
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="brand">EarthScope</div>
          <div className="sub">Global natural events explorer</div>
        </div>
        <div className="badge">
          <span className="badgeDot" /> USGS AND NASA DATA
        </div>
      </header>

      <div className="body">
        <aside className="side">
          <div className="modeTabs" role="group" aria-label="View mode">
            <button
              className={mode === "live" ? "active" : ""}
              aria-pressed={mode === "live"}
              onClick={() => {
                if (mode === "live") return;
                clearResults();
                setMode("live");
              }}
            >
              Live
            </button>
            <button
              className={mode === "history" ? "active" : ""}
              aria-pressed={mode === "history"}
              onClick={() => {
                if (mode === "history") return;
                clearResults();
                setMode("history");
              }}
            >
              History
            </button>
          </div>

          {mode === "live" ? (
            <label className="field">
              Period
              <select
                value={liveDays}
                onChange={(event) => {
                  clearResults();
                  setLiveDays(Number(event.target.value));
                }}
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </label>
          ) : (
            <form onSubmit={submitHistory} className="historyForm">
              <div className="dateFields">
                <label className="field">
                  From UTC{" "}
                  <input
                    type="date"
                    value={start}
                    max={today()}
                    onChange={(event) => setStart(event.target.value)}
                    onInput={(event) => setStart(event.currentTarget.value)}
                  />
                </label>
                <label className="field">
                  To UTC{" "}
                  <input
                    type="date"
                    value={end}
                    max={today()}
                    onChange={(event) => setEnd(event.target.value)}
                    onInput={(event) => setEnd(event.currentTarget.value)}
                  />
                </label>
              </div>
              <p className="muted">
                Up to 90 calendar days. NASA history may be incomplete.
              </p>
              {dateError && (
                <p className="error" role="alert">
                  {dateError}
                </p>
              )}
              <button className="retry" type="submit" disabled={loading}>
                Find events
              </button>
            </form>
          )}

          {mode === "history" && range && (
            <p className="muted">
              Showing period: {range.start} — {range.end} UTC
            </p>
          )}

          <h2 className="sectionHeading">DATA SOURCES</h2>
          <div className="status">
            <span className="pill">USGS · {usgs.length}</span>
            <span className="pill">NASA · {nasa.length}</span>
          </div>
          {lastUpdated && (
            <p className="muted">
              Last updated: {lastUpdated.toLocaleString("en-GB")}
            </p>
          )}
          {loading && (
            <p className="muted" role="status">
              Loading events…
            </p>
          )}
          {Object.entries(errors).map(([source, message]) => (
            <p className="error" role="alert" key={source}>
              {source}: {message}
            </p>
          ))}
          {Object.keys(errors).length > 0 &&
            Object.keys(errors).length < 2 &&
            (usgs.length > 0 || nasa.length > 0) && (
              <p className="partial" role="status">
                Partial data: one source is available. You can retry the other.
              </p>
            )}
          <button
            className="retry"
            onClick={loadData}
            disabled={loading || (mode === "history" && !range)}
          >
            Reload data
          </button>

          <h2 className="sectionHeading">FILTERS</h2>
          <label className="field">
            Search by title or region
            <input
              type="search"
              value={query}
              placeholder="For example, Japan"
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(50);
              }}
            />
          </label>
          <div className="filterGrid">
            <label className="field">
              USGS magnitude from (M4.5+)
              <input
                type="number"
                min="4.5"
                max="10"
                step="0.1"
                value={minMagnitude}
                placeholder="4.5+"
                onChange={(event) => {
                  setMinMagnitude(event.target.value);
                  setVisibleCount(50);
                }}
              />
            </label>
            <label className="field">
              NASA status
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setVisibleCount(50);
                }}
              >
                <option value="all">Any</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
          <div className="categoryHeader">
            <span>Categories</span>
            <button type="button" onClick={() => setChosenCategories(null)}>
              All
            </button>
            <button
              type="button"
              onClick={() => setChosenCategories(new Set())}
            >
              Clear all
            </button>
          </div>
          <div className="categoryList">
            {allCategories.map((category) => (
              <label key={category.id} className="categoryItem">
                <input
                  type="checkbox"
                  checked={
                    chosenCategories === null ||
                    chosenCategories.has(category.id)
                  }
                  onChange={() => toggleCategory(category.id)}
                />
                <span>{category.title}</span>
              </label>
            ))}
          </div>

          <h2 className="listHeading">EVENTS · {events.length}</h2>
          {mode === "history" && !range && (
            <p className="muted">Choose dates and click “Find events”.</p>
          )}
          {!loading &&
            (mode === "live" || range) &&
            events.length === 0 &&
            (!errors.usgs || !errors.nasa) && (
              <p className="muted">No events match the selected filters.</p>
            )}
          {shown.map((event) => (
            <button
              className="eventButton"
              key={event.id}
              onClick={() => setSelected(event)}
              aria-pressed={selectedEvent?.id === event.id}
            >
              <span className="eventTitle">
                <EventIcon
                  event={event}
                  active={selectedEvent?.id === event.id}
                />
                <strong>{event.title}</strong>
              </span>
              <span>
                {event.source.toUpperCase()} ·{" "}
                {latestTime(event)
                  ? new Date(latestTime(event)).toLocaleDateString("en-GB")
                  : "Unknown date"}
              </span>
            </button>
          ))}
          {visibleCount < events.length && (
            <button
              className="moreButton"
              onClick={() => setVisibleCount((count) => count + 50)}
            >
              Show 50 more
            </button>
          )}
        </aside>

        <main className="main">
          <div className="mapwrap">
            <WorldMap
              events={mapEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelected}
            />
            <EventDetails
              event={selectedEvent}
              categories={categories}
              onClose={() => setSelected(null)}
            />
          </div>
          <div className="timeline">
            {mode === "history" && range ? (
              <div className="replayPanel" aria-label="Historical event replay">
                <div className="replayTopline">
                  <strong>Replay</strong>
                  <span>
                    {replayDate?.toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    })}{" "}
                    UTC
                  </span>
                  <span className="replayStats">
                    On map: {replayEventStats.total} · USGS:{" "}
                    {replayEventStats.usgs} · NASA: {replayEventStats.eonet}
                  </span>
                </div>
                <div className="replayControls">
                  <button
                    className="replayButton"
                    onClick={toggleReplay}
                    disabled={!events.length}
                  >
                    {replayPlaying
                      ? "Pause"
                      : replayProgress >= 1
                        ? "Restart"
                        : "Play"}
                  </button>
                  <button
                    className="replayReset"
                    onClick={() => {
                      setReplayPlaying(false);
                      setReplayProgress(0);
                    }}
                    disabled={!events.length}
                  >
                    Reset
                  </button>
                  <input
                    className="replaySlider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={replayProgress}
                    onChange={(event) => {
                      setReplayPlaying(false);
                      setReplayProgress(Number(event.target.value));
                    }}
                    aria-label="Current replay moment"
                  />
                  <label className="replayDuration">
                    Seconds
                    <input
                      type="number"
                      min={replayMinimum}
                      max="600"
                      value={replaySeconds}
                      onChange={(event) =>
                        setReplaySeconds(
                          Math.min(
                            600,
                            Math.max(
                              replayMinimum,
                              Number(event.target.value) || replayMinimum,
                            ),
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <small>
                  Minimum {replayMinimum}s for {range.start} — {range.end}. Only
                  real observations are used.
                </small>
              </div>
            ) : (
              "Timeline is available in History mode"
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
