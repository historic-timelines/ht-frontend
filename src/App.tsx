import { useMemo, useState } from "react";
import { timelineHistoriaArgentina } from "../timelineHistoriaArgentina";
import type { Period, TimelineEvent } from "../types";
import "./App.css";

type Selection =
  | { kind: "period"; item: Period }
  | { kind: "event"; item: TimelineEvent }
  | null;

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pct(time: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((time - min) / (max - min)) * 100;
}

/** Debe coincidir con altura de `.row-bar` y `margin-bottom` de `.period-row` en App.css */
const ROW_BAR_REM = 2.25;
const ROW_MARGIN_REM = 0.1;

function periodRowCenterFromTopRem(rowIndex: number): number {
  return rowIndex * (ROW_BAR_REM + ROW_MARGIN_REM) + ROW_BAR_REM / 2;
}

function mergeAxisMarks(
  periods: { start: Date; end: Date }[],
  events: { date: Date }[]
): { t: number; label: string }[] {
  const raw: { t: number; label: string }[] = [];
  for (const p of periods) {
    raw.push({ t: p.start.getTime(), label: formatDate(p.start) });
    raw.push({ t: p.end.getTime(), label: formatDate(p.end) });
  }
  for (const e of events) {
    raw.push({ t: e.date.getTime(), label: formatDate(e.date) });
  }
  raw.sort((a, b) => a.t - b.t);
  const out: { t: number; label: string }[] = [];
  for (const item of raw) {
    const prev = out[out.length - 1];
    if (prev && prev.t === item.t) {
      if (prev.label !== item.label) {
        prev.label = `${prev.label} · ${item.label}`;
      }
    } else {
      out.push({ ...item });
    }
  }
  return out;
}

export default function App() {
  const { periods, events } = timelineHistoriaArgentina;

  const { min, max } = useMemo(() => {
    const times: number[] = [];
    for (const p of periods) {
      times.push(p.start.getTime(), p.end.getTime());
    }
    for (const e of events) {
      times.push(e.date.getTime());
    }
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [periods, events]);

  const eventsSorted = useMemo(
    () => [...events].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events]
  );

  const axisMarks = useMemo(
    () => mergeAxisMarks(periods, events),
    [periods, events]
  );

  const [sel, setSel] = useState<Selection>(null);

  return (
    <div className="app">
      <div className="app-header-inner">
        <header className="header">
          <h1 className="title">Historia Argentina</h1>
          <p className="subtitle">
            POC de línea de tiempo — datos desde{" "}
            <code>timelineHistoriaArgentina.ts</code>
          </p>
        </header>
      </div>

      <section className="chart chart-bleed" aria-label="Línea de tiempo">
        <div className="timeline-stack">
          <div className="axis">
            {axisMarks.map((mark, i) => {
              const isFirst = i === 0;
              const isLast = i === axisMarks.length - 1;
              const p = pct(mark.t, min, max);
              let edgeClass = "";
              if (isFirst && isLast) {
                if (p <= 6) edgeClass = "tick--start";
                else if (p >= 94) edgeClass = "tick--end";
              } else if (isFirst) {
                edgeClass = "tick--start";
              } else if (isLast) {
                edgeClass = "tick--end";
              }
              return (
                <div
                  key={`${mark.t}-${i}`}
                  className={`tick tick--axis-mark ${edgeClass}`.trim()}
                  style={{ left: `${p}%` }}
                >
                  <span className="tick-line" />
                  <span className="tick-label">{mark.label}</span>
                </div>
              );
            })}
          </div>

          <div className="track-wrap">
            <div className="track-bg" />
            <div className="period-connectors" aria-hidden>
              {periods.flatMap((p, i) => {
                const centerRem = periodRowCenterFromTopRem(i);
                const h = `calc(var(--timeline-axis-gap) + ${centerRem}rem)`;
                const startLeft = pct(p.start.getTime(), min, max);
                const endLeft = pct(p.end.getTime(), min, max);
                return [
                  <div
                    key={`${p.title}-start-conn`}
                    className="period-connector"
                    style={{
                      left: `${startLeft}%`,
                      height: h,
                    }}
                  />,
                  <div
                    key={`${p.title}-end-conn`}
                    className="period-connector"
                    style={{
                      left: `${endLeft}%`,
                      height: h,
                    }}
                  />,
                ];
              })}
            </div>
            <div className="event-connectors" aria-hidden>
              {eventsSorted.map((ev) => (
                <div
                  key={`conn-${ev.title + ev.date.toISOString()}`}
                  className="event-connector"
                  style={{ left: `${pct(ev.date.getTime(), min, max)}%` }}
                />
              ))}
            </div>
            {periods.map((p, i) => {
              const left = pct(p.start.getTime(), min, max);
              const width = Math.max(
                pct(p.end.getTime(), min, max) - left,
                0.8
              );
              const hue = i % 2 === 0 ? "period-a" : "period-b";
              return (
                <div key={p.title} className="period-row">
                  <div className="row-bar">
                    <button
                      type="button"
                      className={`bar ${hue} ${sel?.kind === "period" && sel.item === p ? "active" : ""}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onClick={() => setSel({ kind: "period", item: p })}
                      title={`${formatDate(p.start)} — ${formatDate(p.end)}`}
                    >
                      <span className="bar-text">{p.title}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="events-row">
              <div
                className="row-bar"
                role="group"
                aria-label="Eventos en la línea temporal"
              >
                {events.map((e) => (
                  <button
                    key={e.title + e.date.toISOString()}
                    type="button"
                    className={`event-dot ${sel?.kind === "event" && sel.item === e ? "active" : ""}`}
                    style={{ left: `${pct(e.date.getTime(), min, max)}%` }}
                    onClick={() => setSel({ kind: "event", item: e })}
                    title={e.title}
                    aria-label={e.title}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="app-lower">
        <section className="legend">
          <h2 className="legend-title">Eventos (puntos)</h2>
          <ul className="event-list">
            {events.map((e) => (
              <li key={e.title + e.date.toISOString()}>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setSel({ kind: "event", item: e })}
                >
                  <strong>{e.title}</strong>
                  <span className="muted"> · {formatDate(e.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="detail" aria-live="polite">
          {sel == null ? (
            <p className="detail-placeholder">
              Elegí un período en la barra o un evento en la lista o en la línea.
            </p>
          ) : sel.kind === "period" ? (
            <>
              <h2 className="detail-title">{sel.item.title}</h2>
              <p className="detail-meta">
                {formatDate(sel.item.start)} — {formatDate(sel.item.end)}
              </p>
              <pre className="detail-body">{sel.item.description.trim()}</pre>
            </>
          ) : (
            <>
              <h2 className="detail-title">{sel.item.title}</h2>
              <p className="detail-meta">{formatDate(sel.item.date)}</p>
              <pre className="detail-body">{sel.item.description.trim()}</pre>
              {sel.item.links?.length ? (
                <ul className="links">
                  {sel.item.links.map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        {url.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
