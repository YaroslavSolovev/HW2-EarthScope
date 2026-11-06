import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import WorldMap from "./components/Map/WorldMap.jsx";
import EventDetails from "./components/EventDetails.jsx";
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
  const request = useRef(null);

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

  const allCategories = useMemo(
    () => [
      { id: "earthquake", title: "Землетрясения" },
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
          <div className="sub">Карта природных событий мира</div>
        </div>
        <div className="badge">
          <span className="badgeDot" /> ДАННЫЕ USGS И NASA
        </div>
      </header>

      <div className="body">
        <aside className="side">
          <div className="modeTabs" role="group" aria-label="Режим просмотра">
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
              Период
              <select
                value={liveDays}
                onChange={(event) => {
                  clearResults();
                  setLiveDays(Number(event.target.value));
                }}
              >
                <option value={1}>Последние 24 часа</option>
                <option value={7}>Последние 7 дней</option>
                <option value={30}>Последние 30 дней</option>
              </select>
            </label>
          ) : (
            <form onSubmit={submitHistory} className="historyForm">
              <div className="dateFields">
                <label className="field">
                  С UTC{" "}
                  <input
                    type="date"
                    value={start}
                    max={today()}
                    onChange={(event) => setStart(event.target.value)}
                  />
                </label>
                <label className="field">
                  По UTC{" "}
                  <input
                    type="date"
                    value={end}
                    max={today()}
                    onChange={(event) => setEnd(event.target.value)}
                  />
                </label>
              </div>
              <p className="muted">
                Не больше 90 календарных дней. Архив NASA может быть неполным.
              </p>
              {dateError && (
                <p className="error" role="alert">
                  {dateError}
                </p>
              )}
              <button className="retry" type="submit" disabled={loading}>
                Найти события
              </button>
            </form>
          )}

          {mode === "history" && range && (
            <p className="muted">
              Показан период: {range.start} — {range.end} UTC
            </p>
          )}

          <h2 className="sectionHeading">ИСТОЧНИКИ ДАННЫХ</h2>
          <div className="status">
            <span className="pill">USGS · {usgs.length}</span>
            <span className="pill">NASA · {nasa.length}</span>
          </div>
          {lastUpdated && (
            <p className="muted">
              Последнее обновление: {lastUpdated.toLocaleString("ru-RU")}
            </p>
          )}
          {loading && (
            <p className="muted" role="status">
              Загружаем события…
            </p>
          )}
          {Object.entries(errors).map(([source, message]) => (
            <p className="error" role="alert" key={source}>
              {source}: {message}
            </p>
          ))}
          <button
            className="retry"
            onClick={loadData}
            disabled={loading || (mode === "history" && !range)}
          >
            Обновить данные
          </button>

          <h2 className="sectionHeading">ФИЛЬТРЫ</h2>
          <label className="field">
            Поиск по названию или региону
            <input
              type="search"
              value={query}
              placeholder="Например, Japan"
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(50);
              }}
            />
          </label>
          <div className="filterGrid">
            <label className="field">
              Магнитуда USGS от (M4.5+)
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
              Статус NASA
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setVisibleCount(50);
                }}
              >
                <option value="all">Любой</option>
                <option value="open">Открытые</option>
                <option value="closed">Закрытые</option>
              </select>
            </label>
          </div>
          <div className="categoryHeader">
            <span>Категории</span>
            <button type="button" onClick={() => setChosenCategories(null)}>
              Все
            </button>
            <button
              type="button"
              onClick={() => setChosenCategories(new Set())}
            >
              Снять все
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

          <h2 className="listHeading">СОБЫТИЯ · {events.length}</h2>
          {mode === "history" && !range && (
            <p className="muted">Выберите даты и нажмите «Найти события».</p>
          )}
          {!loading &&
            (mode === "live" || range) &&
            events.length === 0 &&
            (!errors.usgs || !errors.nasa) && (
              <p className="muted">По выбранным условиям событий нет.</p>
            )}
          {shown.map((event) => (
            <button
              className="eventButton"
              key={event.id}
              onClick={() => setSelected(event)}
              aria-pressed={selectedEvent?.id === event.id}
            >
              <strong>{event.title}</strong>
              <span>
                {event.source.toUpperCase()} ·{" "}
                {latestTime(event)
                  ? new Date(latestTime(event)).toLocaleDateString("ru-RU")
                  : "Дата неизвестна"}
              </span>
            </button>
          ))}
          {visibleCount < events.length && (
            <button
              className="moreButton"
              onClick={() => setVisibleCount((count) => count + 50)}
            >
              Показать ещё 50
            </button>
          )}
        </aside>

        <main className="main">
          <div className="mapwrap">
            <WorldMap
              events={events}
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
            Временная шкала и воспроизведение появятся на третьем этапе
          </div>
        </main>
      </div>
    </div>
  );
}
