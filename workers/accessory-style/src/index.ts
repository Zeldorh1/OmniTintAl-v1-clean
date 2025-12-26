// V1 · ACCESSORY STYLE · SAFE PRESET RECOMMENDER
//
// - Returns a few hair accessory ideas based on style vibe + texture.
// - No external calls. Fully local + deterministic.
// - Guarded via guardRequest.

import { guardRequest } from "../../lib/guard";

type AccessoryRequest = {
  texture?: "straight" | "wavy" | "curly" | "coily" | string;
  vibe?: "natural" | "bold" | "minimal" | "glam" | string;
};

type AccessoryItem = {
  id: string;
  name: string;
  tone: string;
  bestFor?: string;
};

type AccessoryResponse = {
  ok: boolean;
  items: AccessoryItem[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildAccessories(req: AccessoryRequest): AccessoryItem[] {
  const texture = (req.texture || "wavy").toLowerCase();
  const vibe = (req.vibe || "natural").toLowerCase();

  const items: AccessoryItem[] = [
    {
      id: "soft-satin-scrunchie",
      name: "Soft Satin Scrunchies",
      tone: "Gentle on hair, reduce creasing and breakage.",
      bestFor: "All textures, especially wavy/curly overnight styles.",
    },
    {
      id: "no-snag-coils",
      name: "No-Snag Spiral Coils",
      tone: "Hold ponytails without harsh tension.",
      bestFor: "Thick or very curly/coily hair.",
    },
    {
      id: "velvet-wide-headband",
      name: "Velvet Wide Headband",
      tone: "Keeps hair off the face without denting the style.",
      bestFor: "Blowouts and loose curls.",
    },
  ];

  if (vibe === "bold" || vibe === "glam") {
    items.push({
      id: "metallic-claw-clips",
      name: "Oversized Metallic Claw Clips",
      tone: "Statement claws that look intentional, not like a backup.",
      bestFor: "Medium to thick hair, quick updos.",
    });
  }

  if (texture === "coily" || texture === "curly") {
    items.push({
      id: "satin-bonnet",
      name: "Satin Sleep Bonnet",
      tone: "Helps preserve curl pattern and moisture overnight.",
      bestFor: "Curly and coily hair.",
    });
  }

  const dedup = new Map(items.map((i) => [i.id, i]));
  return Array.from(dedup.values()).slice(0, 6);
}

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    if (req.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    const decision: any = await guardRequest(req, env, {
      endpoint: "/accessory-style",
      featureTag: "explain",
      priority: "experience",
      estimatedCostCents: 0, // purely local
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

    let body: AccessoryRequest;
    try {
      body = (await req.json()) as AccessoryRequest;
    } catch {
      body = {};
    }

    const items = buildAccessories(body || {});
    const resp: AccessoryResponse = { ok: true, items };
    return json(resp);
  },
};
