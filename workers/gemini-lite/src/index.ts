// workers/gemini-lite/src/index.ts

interface Env {
  GEMINI_API_KEY: string;
  // KV binding kept in the type for future rate limit usage,
  // but we are NOT using it now to avoid 1101 errors.
  RATE_LIMIT_KV: KVNamespace;
  [key: string]: any;
}

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(req.url);

      if (req.method === "POST" && url.pathname === "/scan-hair") {
        // NOTE: guardRequest is DISABLED here on purpose
        // to avoid "Cannot read properties of undefined (reading 'get')".
        return await handleScanHair(req, env);
      }

      return json({ ok: false, error: "not_found" }, 404);
    } catch (err: any) {
      console.error("gemini-lite top-level error", err);
      return json(
        {
          ok: false,
          error: "WORKER_EXCEPTION",
          message: String(err?.message || err),
        },
        500
      );
    }
  },
};

// ----------------- Route handler -----------------

async function handleScanHair(req: Request, env: Env): Promise<Response> {
  try {
    const body = await req.json().catch(() => null);

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

    // Strip any "data:image/jpeg;base64,..." prefix if present
    const cleanBase64 = String(body.imageBase64).replace(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
      ""
    );

    const model = "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              // REST API expects snake_case keys
              inline_data: {
                mime_type: "image/jpeg",
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

    const apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await apiRes.json().catch(() => null);

    if (!apiRes.ok || (raw && (raw.error || raw.status?.code))) {
      console.error("Gemini API error", apiRes.status, raw);
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
  } catch (err: any) {
    console.error("handleScanHair error", err);
    return json(
      {
        ok: false,
        error: "WORKER_EXCEPTION",
        message: String(err?.message || err),
      },
      500
    );
  }
}

// ----------------- Helpers -----------------

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
