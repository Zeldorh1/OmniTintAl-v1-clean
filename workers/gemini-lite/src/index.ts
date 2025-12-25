// workers/gemini-lite/src/index.ts

import { guardRequest } from "../../lib/guard";

interface Env {
  GEMINI_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;
  [key: string]: any;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = Date.now();

    try {
      const url = new URL(req.url);

      // Only one public route: POST /scan-hair
      if (req.method === "POST" && url.pathname === "/scan-hair") {
        const uid =
          req.headers.get("x-user-id") ||
          req.headers.get("x-firebase-uid") ||
          "";

        const tier = (req.headers.get("x-tier") || "unknown").toLowerCase();

        const endpoint = "/scan-hair";
        const featureTag = "scan";        // scan | explain | rerank | chat
        const priority = "experience";    // not core ingestion
        const estimatedCostCents = 0.5;   // Gemini Flash-Lite is cheap

        // ---------- Guard / rate limits ----------
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

        // ---------- Handle the scan ----------
        const res = await handleScanHair(req, env);

        // keep for future telemetry wiring
        const latencyMs = Date.now() - started;
        (latencyMs + uid.length + tier.length);

        return res;
      }

      // Everything else = 404
      return json({ ok: false, error: "not_found" }, 404);
    } catch (err: any) {
      // This prevents Cloudflare 1101 HTML and gives us JSON instead
      console.error("gemini-lite worker exception", err);

      return json(
        {
          ok: false,
          error: "WORKER_EXCEPTION",
          message: err?.message ?? String(err),
        },
        500
      );
    }
  },
};

// ----------------- Route handler -----------------

async function handleScanHair(req: Request, env: Env): Promise<Response> {
  let body: any = null;

  try {
    body = await req.json();
  } catch (err: any) {
    return json(
      {
        ok: false,
        error: "bad_json",
        message: err?.message ?? "Invalid JSON body",
      },
      400
    );
  }

  if (!body?.imageBase64) {
    return json({ ok: false, error: "missing_imageBase64" }, 400);
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

  // Strip any "data:image/...;base64," prefix just in case
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

  let apiRes: Response;
  let raw: any = null;

  try {
    apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    raw = await apiRes.json().catch(() => null);
  } catch (err: any) {
    console.error("Gemini HTTP error", err);
    return json(
      {
        ok: false,
        error: "GEMINI_HTTP_FAILURE",
        message: err?.message ?? String(err),
      },
      502
    );
  }

  if (!apiRes.ok || (raw && (raw.error || raw.status?.code))) {
    console.error("Gemini API error", raw);
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
