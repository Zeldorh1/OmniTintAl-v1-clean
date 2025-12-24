// workers/gemini-lite/src/index.ts

import { guardRequest } from "../lib/guard";

interface Env {
  GEMINI_API_KEY: string;
  // You already bound this to OMNI_LIMITS_KV in Cloudflare;
  // it's not required here, but we keep the type for future use.
  RATE_LIMIT_KV: KVNamespace;
  [key: string]: any;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = Date.now();
    const url = new URL(req.url);

    // We only protect the real endpoint; everything else is 404.
    if (req.method === "POST" && url.pathname === "/scan-hair") {
      const uid =
        req.headers.get("x-user-id") ||
        req.headers.get("x-firebase-uid") ||
        "";
      const tier = (req.headers.get("x-tier") || "unknown").toLowerCase();

      const endpoint = "/scan-hair";
      const featureTag = "scan";        // scan | explain | rerank | chat
      const priority = "experience";    // fallback, not core ingestion
      const estimatedCostCents = 0.5;   // Gemini Flash-Lite is cheap

      // ---------- Global guard + limits ----------
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

      // ---------- Handle the actual hair scan ----------
      const res = await handleScanHair(req, env);

      // (Optional) You can wire telemetry here later via logUsage(...)
      // We still track basic latency in case you want it:
      const latencyMs = Date.now() - started;
      (latencyMs + uid.length + tier.length); // keep vars "used" for TS / future

      return res;
    }

    // Anything else: not a valid route
    return json({ ok: false, error: "not_found" }, 404);
  },
};

// ----------------- Route handler -----------------

async function handleScanHair(req: Request, env: Env): Promise<Response> {
  const body = await req.json().catch(() => null);

  if (!body?.imageBase64) {
    return json({ ok: false, error: "missing imageBase64" }, 400);
  }

  const userPrompt: string | undefined = body.prompt;

  const prompt =
    userPrompt ??
    `
You are OmniTintAI. Analyze this hair image for:
• current hair color (hex + undertone)
• damage score (0-10)
• frizz level (0-10)
• dryness (0-10)
• visible breakage signs
• non-medical product recommendations

Respond ONLY in compact JSON like:
{
  "color": {"hex":"#xxxxxx", "undertone":"warm|neutral|cool"},
  "health": {"damage":0-10, "dryness":0-10, "frizz":0-10, "notes":"..."},
  "recommendations":["...", "..."]
}
`.trim();

  // Strip any "data:image/jpeg;base64," prefix if it’s there
  const cleanBase64 = String(body.imageBase64).replace(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
    ""
  );

  const model = "gemini-2.5-flash-lite";

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
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
      temperature: 0.4,
      maxOutputTokens: 512,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const apiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await apiRes.json().catch(() => null);

  if (!apiRes.ok || (raw && (raw.error || raw.status?.code))) {
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

  return json({
    ok: true,
    model,
    result: text ?? raw,
  });
}

// ----------------- Helpers -----------------

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
