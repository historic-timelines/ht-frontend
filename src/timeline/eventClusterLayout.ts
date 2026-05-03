import type { TimelineEvent } from "../../types";
import type { EventLabelPlacement } from "./eventLabelLayout";
import { readRootRemPx, verticalColumnWidthPx } from "./eventLabelLayout";

export interface EventCluster {
  events: TimelineEvent[];
  minPct: number;
  maxPct: number;
  centerPct: number;
  minMs: number;
  maxMs: number;
  rangeLabel: string;
}

function clusterRangeLabel(minMs: number, maxMs: number): string {
  const y0 = new Date(minMs).getUTCFullYear();
  const y1 = new Date(maxMs).getUTCFullYear();
  if (y0 === y1) return String(y0);
  const sameHundred = Math.floor(y0 / 100) === Math.floor(y1 / 100);
  return sameHundred ? `${y0}–${String(y1).slice(-2)}` : `${y0}–${y1}`;
}

/**
 * Agrupa eventos cuyos footprints de columna vertical se solapan en el eje X.
 * Dos eventos se solapan si la distancia en píxeles entre sus centros es menor que
 * `columnPx + gapPx` (mismo umbral que `assignEventLabelLanes`).
 */
export function groupOverlappingEvents(
  eventsSorted: TimelineEvent[],
  placements: EventLabelPlacement[],
  trackPct: (ms: number) => number,
  stackWidthPx: number
): { clusteredEventSet: ReadonlySet<TimelineEvent>; clusters: EventCluster[] } {
  if (eventsSorted.length === 0 || stackWidthPx <= 0) {
    return { clusteredEventSet: new Set(), clusters: [] };
  }

  const columnPx =
    placements[0]?.columnPx ?? verticalColumnWidthPx(false, readRootRemPx());
  // Umbral basado en solapamiento físico de columnas: umbral decrece con zoom,
  // a diferencia del gapPct de assignEventLabelLanes que tiene piso fijo de 1.35%
  // y sería demasiado grande a zoom alto.
  const CLUSTER_GAP_PX = 4;
  const thresholdPct = ((columnPx + CLUSTER_GAP_PX) / stackWidthPx) * 100;

  type Item = { event: TimelineEvent; pct: number };
  const items: Item[] = eventsSorted.map((event) => ({
    event,
    pct: trackPct(event.date.getTime()),
  }));

  const groups: Item[][] = [];
  let current: Item[] = [items[0]!];

  for (let i = 1; i < items.length; i++) {
    const item = items[i]!;
    const last = current[current.length - 1]!;
    if (item.pct - last.pct < thresholdPct) {
      current.push(item);
    } else {
      groups.push(current);
      current = [item];
    }
  }
  groups.push(current);

  const clusters: EventCluster[] = [];
  const clusteredEventSet = new Set<TimelineEvent>();

  for (const group of groups) {
    if (group.length >= 2) {
      const minPct = group[0]!.pct;
      const maxPct = group[group.length - 1]!.pct;
      const minMs = group[0]!.event.date.getTime();
      const maxMs = group[group.length - 1]!.event.date.getTime();
      clusters.push({
        events: group.map((g) => g.event),
        minPct,
        maxPct,
        centerPct: (minPct + maxPct) / 2,
        minMs,
        maxMs,
        rangeLabel: clusterRangeLabel(minMs, maxMs),
      });
      for (const { event } of group) {
        clusteredEventSet.add(event);
      }
    }
  }

  return { clusteredEventSet, clusters };
}
