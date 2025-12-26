// client/src/brain/sync.ts
// V1 · BRAIN → ML WORKER SYNC
//
// - Reads unsynced events from local eventLogger
// - Respects user consent (shareAnonymizedStats)
// - Anonymizes + minimizes payload to match ml-hair-brain contract
// - Sends batch to POST /sync on ml-hair-brain worker
// - Marks events as synced on success

import { getUnsyncedEvents, markSynced } from "../utils/eventLogger";
import { getConsent } from "../utils/consentStore";

// ✅ 1) POINT THIS AT YOUR DEPLOYED WORKER
// Example after deploy:
//   https://ml-hair-brain.<your-account>.workers.dev
export const BRAIN_SYNC_URL =
  "https://ml-hair-brain.<your-subdomain>.workers.dev"; // ← TODO: replace with real URL

// ✅ 2) INGEST TOKEN (MATCHES env.INGEST_TOKEN IN WORKER)
//
// This is *not* a bank secret; it’s just to prevent random spam.
// Still, treat it like a basic API key and rotate if leaked.
const BRAIN_INGEST_TOKEN = "<YOUR_INGEST_TOKEN_HERE>"; // ← TODO: paste same token you set in Cloudflare

// Optional: tag which client/build is sending events
const SOURCE_TAG = "android-v1";

/**
 * Anonymize + minimize payload (V1):
 * - keep v, id, type, ts, payload only
 * - drop userId / screen / anything else automatically
 *   (since we only forward these five fields)
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

/**
 * Call this from:
 * - BrainDebugScreen button, OR
 * - a BootProbe / startup hook (e.g. once per app open), OR
 * - later, a daily background schedule.
 */
export async function syncBrainNow({ force = false } = {}) {
  try {
    const consent = await getConsent();
    const allowed = !!consent?.shareAnonymizedStats;

    if (!force && !allowed) {
      return { ok: false, skipped: true, reason: "consent_off" };
    }

    if (!BRAIN_SYNC_URL) {
      return { ok: false, skipped: true, reason: "no_url" };
    }

    const events = await getUnsyncedEvents(200);
    if (!events.length) {
      return { ok: true, synced: 0 };
    }

    const batch = anonymizeBatch(events);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (BRAIN_INGEST_TOKEN) {
      headers["Authorization"] = `Bearer ${BRAIN_INGEST_TOKEN}`;
    }

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
      return { ok: false, error: `http_${res.status}` };
    }

    await markSynced(events.map((e) => e.id));
    return { ok: true, synced: events.length };
  } catch (err) {
    console.warn("[brain.sync] syncBrainNow error", err);
    return { ok: false, error: "exception" };
  }
}
