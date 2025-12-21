// client/src/utils/progress/progressEngine.ts
// Minimal V1 engine — V2-ready (haircut-aware, goal-aware)

import type { OmniEvent } from "../../storage/omniEventStore";

export type MeasurementPayload = {
  lengthIn: number;
  method?: "manual" | "vision";
  confidence?: number; // 0..1
  notes?: string;
};

export type HaircutResetPayload = {
  newBaselineIn: number;
  reason?: "haircut" | "trim" | "style_change";
};

export type GoalSetPayload = {
  targetIn: number;
  targetDateTs?: number;
};

export type ProgressDerived = {
  latestLengthIn?: number;
  latestTs?: number;
  baselineIn?: number;
  baselineTs?: number;
  goal?: { targetIn: number; targetDateTs?: number };
  growth30dIn?: number; // inches per 30 days
  growth7dIn?: number;  // inches per 7 days
  slowdown?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toNum(x: any): number | undefined {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

export function buildProgressDerived(events: OmniEvent[]): ProgressDerived {
  // events are expected newest-first
  let latestLengthIn: number | undefined;
  let latestTs: number | undefined;

  let baselineIn: number | undefined;
  let baselineTs: number | undefined;

  let goal: ProgressDerived["goal"];

  // Collect measurements (newest->oldest) but we will compute rates on time windows
  const measurements: { ts: number; lengthIn: number }[] = [];

  for (const e of events) {
    if (e.type === "haircut_reset") {
      const p = e.payload as any;
      const b = toNum(p?.newBaselineIn);
      if (baselineIn === undefined && b !== undefined) {
        baselineIn = b;
        baselineTs = e.ts;
      }
    }

    if (e.type === "goal_set") {
      const p = e.payload as any;
      const t = toNum(p?.targetIn);
      if (!goal && t !== undefined) {
        goal = { targetIn: t, targetDateTs: toNum(p?.targetDateTs) };
      }
    }

    if (e.type === "measurement_added") {
      const p = e.payload as any;
      const len = toNum(p?.lengthIn);
      if (len !== undefined) {
        if (latestLengthIn === undefined) {
          latestLengthIn = len;
          latestTs = e.ts;
        }
        measurements.push({ ts: e.ts, lengthIn: len });
      }
    }
  }

  // If no explicit baseline, use oldest measurement as baseline
  if (baselineIn === undefined && measurements.length) {
    const oldest = measurements[measurements.length - 1];
    baselineIn = oldest.lengthIn;
    baselineTs = oldest.ts;
  }

  // Growth rates: compute change between now and ~window
  const now = Date.now();
  const window7 = now - 7 * 24 * 60 * 60 * 1000;
  const window30 = now - 30 * 24 * 60 * 60 * 1000;

  function closestAtOrBefore(tsCutoff: number) {
    // measurements newest->oldest
    for (let i = 0; i < measurements.length; i++) {
      if (measurements[i].ts <= tsCutoff) return measurements[i];
    }
    // if none older, use oldest available
    return measurements.length ? measurements[measurements.length - 1] : undefined;
  }

  let growth7dIn: number | undefined;
  let growth30dIn: number | undefined;

  if (latestLengthIn !== undefined && measurements.length) {
    const m7 = closestAtOrBefore(window7);
    if (m7) growth7dIn = latestLengthIn - m7.lengthIn;

    const m30 = closestAtOrBefore(window30);
    if (m30) growth30dIn = latestLengthIn - m30.lengthIn;
  }

  // Slowdown heuristic (V1 minimal): negative or near-zero 30d growth and has at least 2 measurements
  const slowdown =
    measurements.length >= 2 &&
    growth30dIn !== undefined &&
    growth30dIn <= 0.05; // ~0.05 inches/month threshold (tune later)

  return {
    latestLengthIn,
    latestTs,
    baselineIn,
    baselineTs,
    goal,
    growth7dIn,
    growth30dIn,
    slowdown,
  };
}
