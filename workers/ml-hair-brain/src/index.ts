// workers/ml-hair-brain/src/index.ts
// V1 · ML HAIR BRAIN · CENTRAL EVENT INGEST · FLAGSHIP
//
// - Accepts anonymized OmniTintAI events from the client brain.
// - Entry: POST /sync  with { batch: OmniEvent[], clientTs }
// - No images / base64 / photos allowed in payload (extra safety).
// - Stores compact events in KV for later analytics / training.
// - Authenticated via shared INGEST_TOKEN (no public writes).

export interface Env {
  EVENT_LOG_KV: KVNamespace;
  INGEST_TOKEN: string; // secret set in Cloudflare dashboard
  ENVIRONMENT?: string; // "dev" | "prod"
}

// Keep in sync with client omniBrainContract.ts
type OmniEventType =
  | "personalization.saved"
  | "scan.completed"
  | "product.used"
  | "bag.added"
  | "purchase.recorded"
  | "app.session";

// Minimal ingest event (matches client OmniEvent, but we ignore userId)
interface OmniEventIngest {
  v: number;
  id: string;
  type: OmniEventType | string; // allow forward-compat; we’ll filter
  ts: number;
  payload: any;
  userId?: string | null;
}

// What we actually store
interface StoredEvent {
  v: number;
  id: string;
  type: string;
  ts: number;
  payload: any;
  // optional metadata for debugging/evolution
  env?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthorized(): Response {
  return json({ ok: false, error: "unauthorized" }, 401);
}

function badRequest(reason = "invalid_payload"): Response {
  return json({ ok: false, error: reason }, 400);
}

// Drop obviously unsafe fields in payload (images, base64, photos, screenshots)
function sanitizePayload(raw: any): any {
  if (raw === null || raw === undefined) return raw;

  const t = typeof raw;
  if (t === "string" || t === "number" || t === "boolean") return raw;
  if (Array.isArray(raw)) return raw.map((x) => sanitizePayload(x)).slice(0, 64);

  if (t === "object") {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(raw)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("image") ||
        lowerKey.includes("base64") ||
        lowerKey.includes("photo") ||
        lowerKey.includes("screenshot")
      ) {
        // Drop image-like fields completely
        continue;
      }
      out[key] = sanitizePayload(value);
    }
    return out;
  }

  // Functions, symbols, etc: drop
  return undefined;
}

// Convert any incoming event into a safe, compact StoredEvent or null
function shapeEvent(evt: any, env: Env): StoredEvent | null {
  if (!evt || typeof evt !== "object") return null;

  const type = String(evt.type || "").trim();
  const ts = Number(evt.ts);
  const id = String(evt.id || "").trim();
  const v = Number(evt.v);

  if (!type || !Number.isFinite(ts) || !id || !Number.isFinite(v)) {
    return null;
  }

  // Optional: restrict to known types now; allow others later.
  const allowedTypes: OmniEventType[] = [
    "personalization.saved",
    "scan.completed",
    "product.used",
    "bag.added",
    "purchase.recorded",
    "app.session",
  ];

  if (!allowedTypes.includes(type as OmniEventType)) {
    // For now, ignore unknown event types to keep V1 tight.
    return null;
  }

  const safePayload = sanitizePayload(evt.payload ?? {});

  const stored: StoredEvent = {
    v,
    id: id.slice(0, 100),
    type,
    ts,
    payload: safePayload,
    env: env.ENVIRONMENT || "dev",
  };

  return stored;
}

// Build KV key: event:YYYY-MM-DD:random
function makeEventKey(now: number): string {
  const d = new Date(now);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 10);
  return `event:${yyyy}-${mm}-${dd}:${rand}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only POST /sync is supported for V1 ingest
    if (request.method !== "POST" || url.pathname !== "/sync") {
      return json({ ok: false, error: "not_found" }, 404);
    }

    // Auth: simple bearer token
    const auth = request.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ")
      ? auth.slice(7).trim()
      : "";

    if (!token || token !== env.INGEST_TOKEN) {
      return unauthorized();
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return badRequest("invalid_json");
    }

    if (!body || typeof body !== "object") {
      return badRequest("invalid_body");
    }

    const batch = Array.isArray(body.batch) ? body.batch : [];
    if (!batch.length) {
      return json({ ok: true, stored: 0, skipped: "empty_batch" });
    }

    // Hard cap batch size so we can't be flooded accidentally
    const MAX_BATCH = 500;
    const slice = batch.slice(0, MAX_BATCH);

    const shaped: StoredEvent[] = [];
    for (const raw of slice) {
      const evt = shapeEvent(raw, env);
      if (evt) shaped.push(evt);
    }

    if (!shaped.length) {
      return json({ ok: false, error: "no_valid_events" }, 400);
    }

    // Persist all events (fire-and-forget style)
    try {
      const ops: Promise<any>[] = [];
      for (const evt of shaped) {
        const key = makeEventKey(evt.ts);
        ops.push(
          env.EVENT_LOG_KV.put(key, JSON.stringify(evt), {
            expirationTtl: 60 * 60 * 24 * 365, // 365 days
          })
        );
      }
      await Promise.all(ops);
    } catch (err) {
      console.error("[ml-hair-brain] KV put error", err);
      // Fail-open to avoid breaking app; just mark as not persisted
      return json({ ok: true, stored: 0, error: "kv_error" });
    }

    return json({
      ok: true,
      stored: shaped.length,
    });
  },
};
