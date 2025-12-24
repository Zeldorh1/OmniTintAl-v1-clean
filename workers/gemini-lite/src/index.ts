export interface Env {
  GEMINI_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;

  // Optional vars (Cloudflare UI)
  FREE_DAILY_LIMIT?: string; // default 50 (cheap worker, used for fallback)
  GLOBAL_DAILY_LIMIT?: string; // optional global cap
  ENVIRONMENT?: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,x-user-id,x-tier",
  "Access-Control-Max-Age": "86400",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function text(data: string, status = 200) {
  return new Response(data, { status, headers: { ...CORS_HEADERS } });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getLimits(env: Env) {
  const free = Number(env.FREE_DAILY_LIMIT ?? "50");
  const global = env.GLOBAL_DAILY_LIMIT ? Number(env.GLOBAL_DAILY_LIMIT) : null;
  return { free, global };
}

function getUserId(req: Request) {
  return (
    req.headers.get("x-user-id") ||
    req.headers.get("cf-connecting-ip") ||
    "anon"
  );
}

async function enforceLimits(env: Env, uid: string) {
  const d = today();
  const { free, global } = getLimits(env);

  const perUserKey = `gemini:${uid}:${d}`;
  const globalKey = `gemini:global:${d}`;

  if (global !== null) {
    const gUsed = Number((await env.RATE_LIMIT_KV.get(globalKey)) ?? "0");
    if (gUsed >= global) {
      return { allowed: false, remaining: 0, used: gUsed, limit: global, scope: "global" as const };
    }
  }

  const used = Number((await env.RATE_LIMIT_KV.get(perUserKey)) ?? "0");
  if (used >= free) {
    return { allowed: false, remaining: 0, used, limit: free, scope: "user" as const };
  }

  const next = used + 1;
  await env.RATE_LIMIT_KV.put(perUserKey, String(next), { expirationTtl: 60 * 60 * 26 });

  if (global !== null) {
    const gUsed = Number((await env.RATE_LIMIT_KV.get(globalKey)) ?? "0");
    await env.RATE_LIMIT_KV.put(globalKey, String(gUsed + 1), { expirationTtl: 60 * 60 * 26 });
  }

  return { allowed: true, remaining: Math.max(0, free - next), used: next, limit: free, scope: "user" as const };
}

async function callGemini(env: Env, prompt: string) {
  // Gemini REST (simple text-only)
  // Endpoint format: https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent?key=...
  const model = "gemini-1.5-flash"; // fast + cheap
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `You are OmniTintAI's assistant. Be concise, practical, and safe.\n` +
              `Avoid medical claims. Suggest patch tests when relevant.\n\n` +
              prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 350,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  if (!res.ok) return { ok: false as const, status: res.status, raw };

  try {
    const data = JSON.parse(raw);
    const content =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("") ||
      "";
    return { ok: true as const, content: String(content || "").trim(), raw: data };
  } catch {
    return { ok: true as const, content: String(raw || "").trim(), raw };
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
          worker: "gemini-lite",
          date: today(),
          env: env.ENVIRONMENT ?? "unknown",
        });
      }

      // Main
      if (req.method === "POST" && url.pathname === "/chat") {
        const uid = getUserId(req);

        const limit = await enforceLimits(env, uid);
        if (!limit.allowed) {
          return json(
            { ok: false, error: "RATE_LIMIT", message: "Daily limit reached.", limit },
            429
          );
        }

        const body = await req.json().catch(() => ({}));
        const prompt = String(body?.prompt || "").trim();
        if (!prompt) return json({ ok: false, error: "BAD_REQUEST", message: "Missing prompt." }, 400);

        const g = await callGemini(env, prompt);
        if (!g.ok) {
          return json(
            { ok: false, error: "GEMINI_ERROR", status: g.status, raw: g.raw },
            502
          );
        }

        return json({
          ok: true,
          uid,
          provider: "gemini",
          limit,
          content: g.content || "No response.",
        });
      }

      return json({ ok: false, error: "NOT_FOUND" }, 404);
    } catch (e: any) {
      return json({ ok: false, error: String(e?.message || e || "unknown_error") }, 500);
    }
  },
};
