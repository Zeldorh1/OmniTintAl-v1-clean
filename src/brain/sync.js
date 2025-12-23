import { getUnsyncedEvents, markSynced } from "../utils/eventLogger";
import { getConsent } from "../utils/consentStore";

// ✅ Set this to your deployed worker route later
// Example: https://YOURDOMAIN.com/ml-hair-brain
export const BRAIN_SYNC_URL = null;

/**
 * Anonymize + minimize payload (V1):
 * - remove userId if present
 * - optionally reduce timestamp precision later (V2)
 */
function anonymizeBatch(events) {
  return events.map((e) => ({
    v: e.v,
    id: e.id,
    type: e.type,
    ts: e.ts,
    payload: e.payload,
  }));
}

/**
 * Call this from BrainDebugScreen button, or BootProbe daily in V2.
 */
export async function syncBrainNow({ force = false } = {}) {
  const consent = await getConsent();
  const allowed = !!consent.shareAnonymizedStats;

  if (!force && !allowed) {
    return { ok: false, skipped: true, reason: "consent_off" };
  }

  if (!BRAIN_SYNC_URL) {
    return { ok: false, skipped: true, reason: "no_url" };
  }

  const events = await getUnsyncedEvents(200);
  if (!events.length) return { ok: true, synced: 0 };

  const batch = anonymizeBatch(events);

  const res = await fetch(`${BRAIN_SYNC_URL}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batch, clientTs: Date.now() }),
  });

  if (!res.ok) {
    return { ok: false, error: `http_${res.status}` };
  }

  await markSynced(events.map((e) => e.id));
  return { ok: true, synced: events.length };
}
