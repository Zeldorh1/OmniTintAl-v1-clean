// V1 · PRODUCT COLOR · SHADE SUGGESTER (SAFE STUB)
//
// - Takes intent like “cover grays / warm / medium brown”
// - Returns a *small*, opinionated list of shade descriptors.
// - Fully local logic for now; optional Grok enrichment later.
// - Guarded via guardRequest.

import { guardRequest } from "../../lib/guard";

type SuggestRequest = {
  goal?: string;            // "cover_grays" | "go_lighter" | etc (free text)
  warmth?: "warm" | "cool" | "neutral" | string;
  depth?: "light" | "medium" | "dark" | string;
};

type ShadeSuggestion = {
  id: string;
  name: string;
  tone: string;
  notes?: string;
};

type SuggestResponse = {
  ok: boolean;
  items: ShadeSuggestion[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildLocalSuggestions(req: SuggestRequest): ShadeSuggestion[] {
  const warmth = (req.warmth || "neutral").toLowerCase();
  const depth = (req.depth || "medium").toLowerCase();
  const goal = (req.goal || "").toLowerCase();

  const out: ShadeSuggestion[] = [];

  if (depth === "dark") {
    out.push({
      id: "soft-black-gloss",
      name: "Soft Black Gloss",
      tone: "Almost-black with a softer edge than jet black.",
      notes: "Good for richer coverage on very dark bases.",
    });
  }

  if (depth === "medium") {
    out.push({
      id: "espresso-brunette-kit",
      name: "Espresso Brunette",
      tone: "Deep neutral brunette with subtle shine.",
      notes: "Low-maintenance for medium brown bases.",
    });
  }

  if (depth === "light") {
    out.push({
      id: warmth === "cool" ? "mushroom-brunette-bridge" : "buttercream-blonde",
      name: warmth === "cool" ? "Mushroom Brunette" : "Buttercream Blonde",
      tone:
        warmth === "cool"
          ? "Cool ashy brunette, good bridge shade when going darker from blonde."
          : "Warm creamy blonde with soft golden reflect.",
      notes: "Always pair with bond-friendly care if lightening.",
    });
  }

  if (goal.includes("gray") || goal.includes("cover")) {
    out.push({
      id: "gray-coverage-kit",
      name: "Rich Auburn Gray Coverage",
      tone:
        "Balanced red-brown that covers grays while fading in a soft, wearable way.",
      notes: "Use as a gloss if you’re nervous about commitment.",
    });
  }

  // Ensure uniqueness and clamp to 5
  const dedup = new Map(out.map((s) => [s.id, s]));
  return Array.from(dedup.values()).slice(0, 5);
}

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    if (req.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    const decision: any = await guardRequest(req, env, {
      endpoint: "/product-color",
      featureTag: "explain",
      priority: "experience",
      estimatedCostCents: 1,
    });

    if (!decision?.ok) {
      return json(
        {
          ok: false,
          error: "rate_limited",
          reason: decision?.reason ?? "blocked",
          retryAfterSec: decision?.retryAfterSec,
        },
        decision?.status || 429
      );
    }

    let body: SuggestRequest;
    try {
      body = (await req.json()) as SuggestRequest;
    } catch {
      return json({ ok: false, error: "invalid_json" }, 400);
    }

    const items = buildLocalSuggestions(body || {});
    const resp: SuggestResponse = { ok: true, items };
    return json(resp);
  },
};
