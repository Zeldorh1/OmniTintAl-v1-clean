// workers/gemini-lite/src/index.ts
// V1 · GEMINI HAIR SCAN · AUTHENTICITY + DUPLICATE + RAPID COLOR CHANGE
//
// POST /scan-hair
// body: { imageBase64: string, prompt?: string }
// returns: { ok, model, scan, authenticity, timing }
//
// - Uses guardRequest() for global cost protection
// - Uses RATE_LIMIT_KV for:
//   • duplicate detection (hash-based)
//   • last-scan tracking (ts + colorHex)
// - Adds `timing.tooFastColorChange` to stop “color changed in 5 min” abuse.

import { guardRequest } from "../../lib/guard";

interface Env {
  GEMINI_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;
  [key: string]: any;
}

type Authenticity = {
  score: number;      // 0–1
  reasons: string[];
  duplicate: boolean;
  hash: string;
};

type HairColor = {
  hex: string;
  undertone?: string;
  level?: number;
};

type HairScan = {
  dryness: number;
  damage: number;
  frizz: number;
  oiliness: number;
  breakageRisk: number;
  notes: string[];
  focus: string[];
  suggestedCategories: string[];
  aiSummary: string;
  aiPlan: { title: string; text: string }[];
  color?: HairColor;
  scanId?: string;
  confidence?: "low" | "medium" | "high";
};

type TimingInfo = {
  lastScanMs: number | null;
  minutesSinceLast: number | null;
  tooFastColorChange: boolean;
};

const RAPID_COLOR_WINDOW_MIN = 60;      // window where big jumps are suspicious (e.g. 60 minutes)
const BIG_COLOR_DELTA = 0.3;           // 0–1 scale; >0.3 = “big change”

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/scan-hair") {
      const uid =
        req.headers.get("x-user-id") ||
        req.headers.get("x-firebase-uid") ||
        req.headers.get("cf-connecting-ip") ||
        "anon";

      const tier = (req.headers.get("x-tier") || "unknown").toLowerCase();

      const endpoint = "/scan-hair";
      const featureTag = "scan";      // scan | explain | rerank | chat
      const priority = "core";        // feeds the brain
      const estimatedCostCents = 0.3; // Gemini Flash-Lite is cheap

      const decision = await guardRequest(req, env, {
        endpoint,
        featureTag,
        priority,
        estimatedCostCents,
      });

      if (!decision.ok) {
        return json(
          {
            ok: false,
            error: "rate_limited",
            reason: decision.reason,
            retryAfterSec: decision.retryAfter,
          },
          decision.httpStatus ?? 429
        );
      }

      const res = await handleScanHair(req, env, uid, tier);
      return res;
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};

// ----------------- CORE HANDLER -----------------

async function handleScanHair(
  req: Request,
  env: Env,
  uid: string,
  tier: string
): Promise<Response> {
  const body = await req.json().catch(() => null);

  if (!body?.imageBase64) {
    return json({ ok: false, error: "missing imageBase64" }, 400);
  }

  const userPrompt: string | undefined = body.prompt;

  const analysisPrompt =
    userPrompt ??
    `
You are OmniTintAI. Analyze this hair image STRICTLY for:

1) HAIR HEALTH METRICS (0–10):
   - dryness
   - damage
   - frizz
   - oiliness
   - breakageRisk

2) HAIR COLOR:
   - hex (e.g. "#4b2f20")
   - undertone: "warm", "neutral", or "cool"
   - optional level: 1–10 (1 = darkest, 10 = lightest)

3) FOCUS AREAS: 2–4 short phrases like:
   - "strength & breakage"
   - "frizz control"
   - "hydration & shine"

4) SHOPPING / ROUTINE CATEGORIES:
   - 2–6 simple category names like:
     "bond repair", "hydrating masks", "color-safe shampoo", "anti-frizz serum"

5) AI SUMMARY:
   - 2–4 sentences explaining what you see and what matters most.

6) 4-WEEK PLAN:
   - 3–6 steps, each with:
     { "title": "Step name", "text": "One or two sentences" }

7) AUTHENTICITY ESTIMATE:
   - Is this likely:
     • a real user hair photo
     • a photo of a screen
     • a stock model image
     • an AI-generated or heavily edited image
   - Give authenticity.score 0–1 and reasons[].

Respond ONLY in this JSON shape (no markdown, no extra commentary):

{
  "metrics": {
    "dryness": 0-10,
    "damage": 0-10,
    "frizz": 0-10,
    "oiliness": 0-10,
    "breakageRisk": 0-10
  },
  "color": {
    "hex": "string",
    "undertone": "warm|neutral|cool",
    "level": 1-10
  },
  "focus": ["...", "..."],
  "suggestedCategories": ["...", "..."],
  "aiSummary": "string",
  "aiPlan": [
    { "title": "string", "text": "string" }
  ],
  "authenticity": {
    "score": 0-1,
    "reasons": ["...", "..."]
  }
}
`.trim();

  // Strip any "data:image/xxx;base64," prefix
  const cleanBase64 = String(body.imageBase64).replace(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
    ""
  );

  // ---------- duplicate detection ----------
  const hash = await sha256Hex(cleanBase64);
  const dupKey = `hair_scan_hash:${hash}`;
  const existing = await env.RATE_LIMIT_KV.get(dupKey);
  const isDuplicate = !!existing;
  // Keep hashes ~30 days
  await env.RATE_LIMIT_KV.put(dupKey, uid, { expirationTtl: 60 * 60 * 24 * 30 });

  const model = "gemini-2.5-flash-lite";

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: analysisPrompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 700,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const apiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await apiRes.json().catch(() => null);

  if (!apiRes.ok || !raw) {
    return json(
      {
        ok: false,
        error: "GEMINI_ERROR",
        status: apiRes.status,
        raw,
      },
      502
    );
  }

  const text: string | undefined =
    raw?.candidates?.[0]?.content?.parts?.[0]?.text;

  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return json(
      {
        ok: false,
        error: "PARSE_ERROR",
        raw: text || raw,
      },
      502
    );
  }

  // ---------- authenticity (base from model) ----------
  const authRaw = parsed.authenticity || {};
  const authenticity: Authenticity = {
    score: clampNumber(authRaw.score, 0, 1, 0.5),
    reasons: Array.isArray(authRaw.reasons)
      ? authRaw.reasons.map((r: any) => String(r))
      : [],
    duplicate: isDuplicate,
    hash,
  };

  if (isDuplicate) {
    authenticity.score = Math.min(authenticity.score, 0.3);
    authenticity.reasons.push("Possible duplicate of a previous scan image.");
  }

  // ---------- color extraction ----------
  const colorRaw = parsed.color || {};
  const colorHex = normalizeHex(colorRaw.hex);
  const color: HairColor | undefined = colorHex
    ? {
        hex: colorHex,
        undertone: colorRaw.undertone
          ? String(colorRaw.undertone).toLowerCase()
          : undefined,
        level: Number.isFinite(Number(colorRaw.level))
          ? Number(colorRaw.level)
          : undefined,
      }
    : undefined;

  // ---------- timing + rapid color-change check ----------
  const nowMs = Date.now();
  const lastKey = `hair_last_scan:${uid}`;
  const lastJson = await env.RATE_LIMIT_KV.get(lastKey);
  let lastScanMs: number | null = null;
  let lastColorHex: string | null = null;

  if (lastJson) {
    try {
      const parsedLast = JSON.parse(lastJson);
      lastScanMs = Number(parsedLast.ts) || null;
      lastColorHex = typeof parsedLast.colorHex === "string" ? parsedLast.colorHex : null;
    } catch {
      lastScanMs = null;
      lastColorHex = null;
    }
  }

  let minutesSinceLast: number | null = null;
  let tooFastColorChange = false;

  if (lastScanMs) {
    minutesSinceLast = Math.max(0, Math.round((nowMs - lastScanMs) / 60000));
  }

  if (lastScanMs && lastColorHex && colorHex) {
    const deltaMinutes = (nowMs - lastScanMs) / 60000;
    const dist = hexDistance(lastColorHex, colorHex); // 0–1

    if (deltaMinutes < RAPID_COLOR_WINDOW_MIN && dist > BIG_COLOR_DELTA) {
      tooFastColorChange = true;

      authenticity.score = Math.min(authenticity.score, 0.4);
      authenticity.reasons.push(
        `Large hair color change detected in ~${Math.round(
          deltaMinutes
        )} minutes; flagged as suspicious.`
      );
    }
  }

  // Always update last-scan record (we still store it even if low auth — you can tune behavior later)
  await env.RATE_LIMIT_KV.put(
    lastKey,
    JSON.stringify({ ts: nowMs, colorHex: colorHex || lastColorHex }),
    { expirationTtl: 60 * 60 * 24 * 60 } // keep ~60 days
  );

  const timing: TimingInfo = {
    lastScanMs,
    minutesSinceLast,
    tooFastColorChange,
  };

  // ---------- HairScan object for your UI ----------
  const m = parsed.metrics || {};
  const scan: HairScan = {
    dryness: toScore(m.dryness),
    damage: toScore(m.damage),
    frizz: toScore(m.frizz),
    oiliness: toScore(m.oiliness),
    breakageRisk: toScore(m.breakageRisk),
    notes: [],
    focus: Array.isArray(parsed.focus)
      ? parsed.focus.map((f: any) => String(f))
      : [],
    suggestedCategories: Array.isArray(parsed.suggestedCategories)
      ? parsed.suggestedCategories.map((c: any) => String(c))
      : [],
    aiSummary: String(parsed.aiSummary || "").trim(),
    aiPlan: Array.isArray(parsed.aiPlan)
      ? parsed.aiPlan.map((p: any) => ({
          title: String(p?.title || "").trim() || "Step",
          text: String(p?.text || "").trim(),
        }))
      : [],
    color,
    scanId: `gem_${hash.slice(0, 16)}`,
    confidence: authenticity.score >= 0.8 ? "high" :
                authenticity.score >= 0.5 ? "medium" : "low",
  };

  return json({
    ok: true,
    model,
    scan,
    authenticity,
    timing,
  });
}

// ----------------- Helpers -----------------

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clampNumber(
  v: any,
  min: number,
  max: number,
  fallback: number
): number {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function toScore(v: any): number {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

async function sha256Hex(base64: string): Promise<string> {
  const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bin);
  const bytes = new Uint8Array(digest);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeHex(v: any): string {
  if (!v) return "";
  let s = String(v).trim();
  if (!s) return "";
  if (!s.startsWith("#")) s = "#" + s;
  if (!/^#[0-9a-fA-F]{6}$/.test(s)) return "";
  return s.toLowerCase();
}

// Simple RGB distance 0–1 between two hex colors
function hexDistance(a: string, b: string): number {
  if (!/^#[0-9a-f]{6}$/.test(a) || !/^#[0-9a-f]{6}$/.test(b)) return 0;

  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);

  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;

  const dist = Math.sqrt(dr * dr + dg * dg + db * db); // 0–441
  return dist / 441; // normalize to 0–1
}
