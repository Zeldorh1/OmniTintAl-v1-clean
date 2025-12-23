// client/src/brain/derivedState.ts
// Minimal V1 derived helpers (local only).
// These become your “self-aware context pack” later.

import { getEventsSince } from "../utils/eventLogger";

export async function getLatestScan(): Promise<null | {
  ts: number;
  scanId: string;
  metrics: Record<string, number>;
  flags?: string[];
  confidence?: string;
}> {
  const since = Date.now() - 1000 * 60 * 60 * 24 * 365; // last year
  const events = await getEventsSince(since, 800);
  const scans = events.filter((e: any) => e.type === "scan.completed");
  if (!scans.length) return null;

  const last: any = scans[scans.length - 1];
  return {
    ts: last.ts,
    scanId: last.payload?.scanId,
    metrics: last.payload?.metrics || {},
    flags: last.payload?.flags || [],
    confidence: last.payload?.confidence,
  };
}

export async function getLastPersonalization(): Promise<any | null> {
  const since = Date.now() - 1000 * 60 * 60 * 24 * 365;
  const events = await getEventsSince(since, 800);
  const p = events.filter((e: any) => e.type === "personalization.saved");
  if (!p.length) return null;
  return p[p.length - 1]?.payload?.profile ?? null;
}
