// client/src/brain/sync.ts
// V1 · BRAIN → ML WORKER SYNC · FLAGSHIP
//
// - Reads unsynced events from local eventLogger
// - Respects user consent (shareAnonymizedStats)
// - Anonymizes + minimizes payload to match ml-hair-brain contract
// - Sends batch to POST /sync on ml-hair-brain worker
// - Marks events as synced on success
// - Designed to be safe, cheap, and future-proof for V2 training

import { getUnsyncedEvents, markSynced } from "../utils/eventLogger";
import { getConsent } from "../utils/consentStore";

// ✅ 1) POINT THIS AT YOUR DEPLOYED WORKER
// Replace with your real workers.dev URL if different.
export const BRAIN_SYNC_URL =
  "https://ml-hair-brain.withered-sound-1f6b.workers.dev";

// ✅ 2) INGEST TOKEN (MATCHES env.INGEST_TOKEN IN WORKER)
// Paste the exact token you set as a secret on the ml-hair-brain worker.
const BRAIN_INGEST_TOKEN = "<PASTE_YOUR_INGEST_TOKEN_HERE>";

// Optional: tag which client/build is sending events
const SOURCE_TAG = "android-v1";

// Hard limits so we never spam the worker or battery
const MAX_BATCH_SIZE = 200; // must be <= worker MAX_BATCH (500)
const MAX_TOTAL_PER_SYNC = 600; // 3 batches max per call

type SyncResult =
  | { ok: true; synced: number }
  | { ok: false; skipped?: boolean; reason?: string; error?: string };

/**
 * Anonymize + minimize payload (V1):
 * - keep v, id, type, ts, payload only
 * - we intentionally drop userId / screen / device info
 *   so everything that reaches Cloudflare is already clean.
 */
function anonymizeBatch(events: any[]) {
  return events.map((e) => ({
    v: e.v,
    id: e.id,
    type: e.type,
    ts: e.ts,
    payload: e.payload,
  }));
}

async function sendBatch(batch: any[]): Promise<SyncResult> {
  if (!BRAIN_SYNC_URL) {
    return { ok: false, skipped: true, reason: "no_url" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (BRAIN_INGEST_TOKEN) {
    headers["Authorization"] = `Bearer ${BRAIN_INGEST_TOKEN}`;
  }

  try {
    const res = await fetch(`${BRAIN_SYNC_URL}/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        batch,
        clientTs: Date.now(),
        source: SOURCE_TAG,
      }),
    });

    if (!res.ok) {
      // 401/403 are "permanent" until you fix token / URL
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: `auth_${res.status}` };
      }
      return { ok: false, error: `http_${res.status}` };
    }

    // Optional: read response for debugging, but don't depend on it.
    // This keeps API contract loose for future V2 changes.
    try {
      const json = await res.json();
      if (__DEV__) {
        console.log("[brain.sync] worker response", json);
      }
    } catch {
      // Response not JSON or no body – that's fine.
    }

    return { ok: true, synced: batch.length };
  } catch (err) {
    console.warn("[brain.sync] sendBatch error", err);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Call this from:
 * - BrainDebugScreen button, OR
 * - a BootProbe / startup hook (e.g. once per app open), OR
 * - later, a daily background schedule.
 *
 * It will:
 *  - Respect consent (unless force=true)
 *  - Drain up to MAX_TOTAL_PER_SYNC events in 200-event chunks
 *  - Stop on first hard error (e.g. bad token) so we don’t spam
 */
export async function syncBrainNow({
  force = false,
}: { force?: boolean } = {}): Promise<SyncResult> {
  // 1) Consent gate
  if (!force) {
    try {
      const consent = await getConsent();
      const allowed = !!consent?.shareAnonymizedStats;
      if (!allowed) {
        return { ok: false, skipped: true, reason: "consent_off" };
      }
    } catch (err) {
      console.warn("[brain.sync] getConsent error", err);
      // Fail-safe: if consent store is broken, do NOT send.
      return { ok: false, skipped: true, reason: "consent_error" };
    }
  }

  let totalSynced = 0;

  // 2) Drain events in a few small batches (better for battery & cost)
  while (totalSynced < MAX_TOTAL_PER_SYNC) {
    const remaining = MAX_TOTAL_PER_SYNC - totalSynced;
    const limit = Math.min(MAX_BATCH_SIZE, remaining);

    const events = await getUnsyncedEvents(limit);
    if (!events.length) {
      break;
    }

    const batch = anonymizeBatch(events);
    const result = await sendBatch(batch);

    if (!result.ok) {
      // For auth / config errors, stop immediately.
      if (result.error?.startsWith("auth_") || result.error === "no_url") {
        return result;
      }

      // For transient network / HTTP errors, stop but keep existing progress.
      if (__DEV__) {
        console.log("[brain.sync] transient error, stopping drain", result);
      }
      return { ok: false, error: result.error ?? "unknown" };
    }

    // Mark these as synced ONLY if worker accepted them.
    await markSynced(events.map((e: any) => e.id));
    totalSynced += events.length;

    // If we synced less than the limit, there’s nothing left to drain.
    if (events.length < limit) break;

    // Tiny pause between batches to be nice to battery/network.
    await new Promise((r) => setTimeout(r, 150));
  }

  return { ok: true, synced: totalSynced };
}
