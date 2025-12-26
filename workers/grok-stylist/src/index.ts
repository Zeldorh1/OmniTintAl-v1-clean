// workers/grok-stylist/src/index.ts
// V1 · HAIR-ONLY GROK STYLIST · GEMINI FALLBACK + DISCLAIMER
//
// POST /chat
// body: { prompt: string }
//
// - Only answers hair / scalp / hair-product topics
// - Grok first, Gemini-lite fallback (worker-to-worker)
// - Always prepends disclaimer before any instructions
// - Guarded by guardRequest() + KV (global limits)

import { guardRequest } from "../lib/guard";

interface Env {
  GROK_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;

  // Optional: URL of your gemini-lite worker for fallback
  // e.g. https://gemini-lite.<your-subdomain>.workers.dev
  GEMINI_FALLBACK_URL?: string;

  ENVIRONMENT?: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,x-user-id,x-firebase-uid,x-tier",
  "Access-Control-Max-Age": "86400",
};

const DISCLAIMER =
  "Disclaimer: OmniTintAI gives general hair-care guidance only. This is NOT medical advice. Always follow product instructions, perform a patch test, and consult a professional for chemical or drastic treatments.";

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function text(data: string, status = 200): Response {
  return new Response(data, { status, headers: { ...CORS_HEADERS } });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === "OPTIONS") return text("", 204);

    const url = new URL(req.url);

    // Health check
    if (req.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        worker: "grok-stylist",
        date: today(),
        env: env.ENVIRONMENT ?? "unknown",
      });
    }

    // Main chat endpoint
    if (req.method === "POST" && url.pathname === "/chat") {
      const uid =
        req.headers.get("x-user-id") ||
        req.headers.get("x-firebase-uid") ||
        req.headers.get("cf-connecting-ip") ||
        "anon";

      const tier = (req.headers.get("x-tier") || "free").toLowerCase();

      // Global guard / budget / abuse protection
      const decision = await guardRequest(req, env, {
        endpoint: "/grok-stylist/chat",
        featureTag: "chat",        // scan | explain | rerank | chat
        priority: "experience",    // not core ingestion
        estimatedCostCents: 1.0,   // Grok-2 text is still cheap at our limits
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

      return routeChat(req, env, uid, tier);
    }

    return json({ ok: false, error: "NOT_FOUND" }, 404);
  },
};

// ----------------- Route handler -----------------

async function routeChat(
  req: Request,
  env: Env,
  uid: string,
  tier: string
): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const rawPrompt = String(body?.prompt || "").trim();

  if (!rawPrompt) {
    return json({ ok: false, error: "BAD_REQUEST", message: "Missing prompt." }, 400);
  }

  // Hair-domain filter: reject obvious non-hair topics
  if (!isHairDomainPrompt(rawPrompt)) {
    return json({
      ok: true,
      content:
        `${DISCLAIMER}\n\n` +
        "This assistant is strictly for hair, scalp, and hair-product guidance. " +
        "I can help with things like damage repair, color choices, routines, ingredients, and styling tips — " +
        "but I can't answer unrelated questions.",
      provider: "policy",
    });
  }

  // Try Grok first
  let provider: "grok" | "gemini-fallback" = "grok";
  let answer = "";

  try {
    const grok = await callGrok(env, rawPrompt);
    if (!grok.ok) throw new Error(`grok_failed_${grok.status}`);
    answer = grok.content;
  } catch (err) {
    // Fallback to Gemini-lite worker if configured
    if (env.GEMINI_FALLBACK_URL) {
      provider = "gemini-fallback";
      const g = await callGeminiFallback(env, rawPrompt, tier);
      answer = g;
    } else {
      return json(
        {
          ok: false,
          error: "UPSTREAM_ERROR",
          message: "Hair stylist brain is temporarily unavailable. Try again in a bit.",
        },
        502
      );
    }
  }

  const content = buildFinalAnswer(answer);

  return json({
    ok: true,
    uid,
    tier,
    provider,
    content,
  });
}

// ----------------- Hair-domain filter -----------------

function isHairDomainPrompt(prompt: string): boolean {
  const p = prompt.toLowerCase();

  const hairKeywords = [
    "hair",
    "scalp",
    "roots",
    "split ends",
    "frizz",
    "dandruff",
    "bleach",
    "bleaching",
    "toner",
    "toning",
    "hair dye",
    "dye my hair",
    "box dye",
    "developer",
    "10 volume",
    "20 volume",
    "30 volume",
    "40 volume",
    "balayage",
    "highlights",
    "lowlights",
    "gloss",
    "toning shampoo",
    "purple shampoo",
    "bond repair",
    "olaplex",
    "k18",
    "leave-in conditioner",
    "hair mask",
    "deep conditioner",
    "hair oil",
    "curly hair",
    "coily",
    "straight hair",
    "wavy hair",
    "hair porosity",
    "hair density",
    "hair type",
    "hair routine",
    "protective style",
    "braids",
    "locs",
    "loc maintenance",
    "twists",
    "fade haircut",
    "barber",
    "haircut",
  ];

  return hairKeywords.some((kw) => p.includes(kw));
}

// ----------------- Grok call -----------------

async function callGrok(env: Env, prompt: string): Promise<{ ok: boolean; status?: number; content: string }> {
  const body = {
    model: "grok-2",
    messages: [
      {
        role: "system",
        content:
          "You are OmniTintAI's professional hair stylist assistant.\n" +
          "- ONLY answer questions about hair, scalp, and hair-related products.\n" +
          "- Do NOT give medical advice or diagnose conditions.\n" +
          "- For chemical treatments (bleach, high-lift, relaxers, perms, strong actives), be conservative and recommend patch tests and professional help.\n" +
          "- Avoid extreme or unsafe experiments. Safety first.\n" +
          "- If the user asks something non-hair-related, politely redirect back to hair topics.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.55,
    max_tokens: 600,
  };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    return { ok: false, status: res.status, content: text || "" };
  }

  let raw: any = null;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: true, content: text || "" };
  }

  const content =
    raw?.choices?.[0]?.message?.content ??
    raw?.choices?.[0]?.delta?.content ??
    "";

  return { ok: true, content: String(content || "").trim() };
}

// ----------------- Gemini-lite fallback -----------------

async function callGeminiFallback(env: Env, prompt: string, tier: string): Promise<string> {
  const base = (env.GEMINI_FALLBACK_URL || "").replace(/\/+$/, "");
  if (!base) throw new Error("missing_gemini_fallback_url");

  const res = await fetch(`${base}/chat-hair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tier": tier,
    },
    body: JSON.stringify({ prompt }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`gemini_fallback_failed_${res.status}`);

  try {
    const json = JSON.parse(text);
    return String(json?.content || json?.reply || text || "");
  } catch {
    return text || "";
  }
}

// ----------------- Final answer builder -----------------

function buildFinalAnswer(body: string): string {
  const trimmed = String(body || "").trim();
  if (!trimmed) {
    return (
      DISCLAIMER +
      "\n\n" +
      "Something went wrong generating a response. Please try again with a clear hair-related question."
    );
  }

  // Always prepend disclaimer + a subtle separator
  return `${DISCLAIMER}\n\n${trimmed}`;
}
