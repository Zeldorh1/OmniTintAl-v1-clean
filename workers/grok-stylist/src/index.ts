export interface Env {
  GROK_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;

  // Optional vars (set as plain env vars in Cloudflare UI, not secrets)
  GEMINI_FALLBACK_URL?: string; // e.g. https://gemini-lite.<subdomain>.workers.dev
  FREE_DAILY_LIMIT?: string; // default 3
  PREMIUM_DAILY_LIMIT?: string; // default 100 (hidden fair use)
  GLOBAL_DAILY_LIMIT?: string; // optional global cap
  ENVIRONMENT?: string;
}

type AuthUser = {
  uid: string;
  isPremium: boolean;
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(data: any, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extra },
  });
}

function text(data: string, status = 200) {
  return new Response(data, { status, headers: { ...CORS_HEADERS } });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getLimits(env: Env) {
  const free = Number(env.FREE_DAILY_LIMIT ?? "3");
  const prem = Number(env.PREMIUM_DAILY_LIMIT ?? "100");
  const global = env.GLOBAL_DAILY_LIMIT ? Number(env.GLOBAL_DAILY_LIMIT) : null;
  return { free, prem, global };
}

/**
 * V1 AUTH (simple, safe enough):
 * - Premium determination via header only (server decides).
 * - uid from header (or IP fallback).
 *
 * In V2 you’ll swap to Firebase/JWT.
 */
function getUser(req: Request): AuthUser {
  const uid =
    req.headers.get("x-user-id") ||
    req.headers.get("x-firebase-uid") ||
    req.headers.get("cf-connecting-ip") ||
    "anon";

  const tier = (req.headers.get("x-tier") || "free").toLowerCase();
  const isPremium = tier === "premium" || tier === "pro";

  return { uid, isPremium };
}

/**
 * KV rate limit (per-user + optional global cap)
 */
async function enforceLimits(env: Env, user: AuthUser) {
  const d = today();
  const { free, prem, global } = getLimits(env);

  const max = user.isPremium ? prem : free;
  const perUserKey = `grok:${user.uid}:${d}`;
  const globalKey = `grok:global:${d}`;

  // optional global cap (safety kill switch)
  if (global !== null) {
    const gUsed = Number((await env.RATE_LIMIT_KV.get(globalKey)) ?? "0");
    if (gUsed >= global) {
      return { allowed: false, remaining: 0, used: gUsed, limit: global, scope: "global" as const };
    }
  }

  const used = Number((await env.RATE_LIMIT_KV.get(perUserKey)) ?? "0");
  if (used >= max) {
    return { allowed: false, remaining: 0, used, limit: max, scope: "user" as const };
  }

  const next = used + 1;
  await env.RATE_LIMIT_KV.put(perUserKey, String(next), { expirationTtl: 60 * 60 * 26 });

  if (global !== null) {
    const gUsed = Number((await env.RATE_LIMIT_KV.get(globalKey)) ?? "0");
    await env.RATE_LIMIT_KV.put(globalKey, String(gUsed + 1), { expirationTtl: 60 * 60 * 26 });
  }

  return { allowed: true, remaining: Math.max(0, max - next), used: next, limit: max, scope: "user" as const };
}

/**
 * Grok proxy
 */
async function callGrok(env: Env, prompt: string) {
  const body = {
    model: "grok-2-mini",
    messages: [
      {
        role: "system",
        content:
          "You are OmniTintAI's professional hair stylist assistant. Be concise, practical, and safe. Avoid medical claims. Suggest patch tests when relevant.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 450,
  };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  if (!res.ok) return { ok: false as const, status: res.status, raw };

  try {
    return { ok: true as const, data: JSON.parse(raw) };
  } catch {
    return { ok: true as const, data: raw };
  }
}

/**
 * Gemini fallback call (calls your gemini-lite worker)
 * IMPORTANT: This is worker-to-worker; Gemini key stays ONLY in gemini-lite.
 */
async function callGeminiFallback(env: Env, prompt: string) {
  const base = (env.GEMINI_FALLBACK_URL || "").replace(/\/+$/, "");
  if (!base) throw new Error("missing_gemini_fallback_url");

  const res = await fetch(`${base}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // optional header so gemini-lite can apply tier rules too:
      "x-tier": "fallback",
    },
    body: JSON.stringify({ prompt }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`gemini_fallback_failed_${res.status}`);

  try {
    return JSON.parse(raw);
  } catch {
    return { ok: true, content: String(raw || "") };
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      if (req.method === "OPTIONS") return text("", 204);

      const url = new URL(req.url);

      // Health
      if (req.method === "GET" && url.pathname === "/") {
        return json({
          ok: true,
          worker: "grok-stylist",
          date: today(),
          env: env.ENVIRONMENT ?? "unknown",
        });
      }

      // Main endpoint
      if (req.method === "POST" && url.pathname === "/chat") {
        const user = getUser(req);

        // limits
        const limit = await enforceLimits(env, user);
        if (!limit.allowed) {
          return json(
            { ok: false, error: "RATE_LIMIT", message: "Daily limit reached.", limit },
            429
          );
        }

        const body = await req.json().catch(() => ({}));
        const prompt = String(body?.prompt || "").trim();
        if (!prompt) return json({ ok: false, error: "BAD_REQUEST", message: "Missing prompt." }, 400);

        // Try Grok first
        let provider: "grok" | "gemini" = "grok";
        let content = "";

        try {
          const grok = await callGrok(env, prompt);
          if (!grok.ok) throw new Error(`grok_failed_${grok.status}`);

          content =
            grok.data?.choices?.[0]?.message?.content ??
            grok.data?.choices?.[0]?.delta?.content ??
            "";
          if (!content) content = "No response.";
        } catch (e) {
          // Fallback to Gemini (cheap + safe)
          provider = "gemini";
          const g = await callGeminiFallback(env, prompt);
          content = String(g?.content || g?.reply || "").trim() || "No response.";
        }

        return json({
          ok: true,
          uid: user.uid,
          isPremium: user.isPremium,
          provider,
          limit,
          content,
        });
      }

      return json({ ok: false, error: "NOT_FOUND" }, 404);
    } catch (e: any) {
      const msg = String(e?.message || e || "unknown_error");
      const status =
        msg.includes("missing_gemini_fallback_url") ? 500 :
        500;
      return json({ ok: false, error: msg }, status);
    }
  },
};
