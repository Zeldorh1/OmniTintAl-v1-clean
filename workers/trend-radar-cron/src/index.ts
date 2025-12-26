// workers/trend-radar-cron/index.ts
// V1 · TREND RADAR CRON · US-ONLY HAIR TRENDS
//
// - Runs on a schedule (Cloudflare Cron) to refresh trend data
// - Always stays in HAIR COLOR / HAIR PRODUCTS domain
// - Optional enrichment:
//    • GROK_STYLIST_URL  (calls your /grok-stylist worker or API gateway)
//    • AMAZON_SEARCH_URL (your /amazon-search worker)
// - Writes to KV key TREND_RADAR_LATEST used by trend-radar worker.
                                                                                        export interface Env {
  TREND_RADAR_KV: KVNamespace;
                                                                                          // Optional: if you wire these later, enrichment will kick in automatically.
  GROK_STYLIST_URL?: string;
  AMAZON_SEARCH_URL?: string;
}

type TrendItem = {
  id: string;
  name: string;
  tone: string;
  score: number; // 0–1
  hex?: string;
  sources?: string[];
};
                                                                                        type TrendPayload = {
  updatedAt: number | null;
  items: TrendItem[];
};
                                                                                        const KV_KEY = "TREND_RADAR_LATEST";                                                                                                                                            // Seed US-only hair color trends – safe, cosmetic, non-medical.
const SEED_TRENDS: Omit<TrendItem, "score">[] = [
  {
    id: "espresso-brunette",
    name: "Espresso Brunette",                                                              tone: "Deep neutral brown with subtle shine, low-maintenance and salon-safe when done professionally.",
    hex: "#3B2A24",
    sources: ["Social buzz", "Salon posts"],
  },
  {                                                                                         id: "cowgirl-copper",                                                                   name: "Cowgirl Copper",
    tone: "Warm copper with soft dimension, popular for fall in the US.",
    hex: "#B4552C",
    sources: ["TikTok US", "Pinterest US"],
  },
  {
    id: "expensive-blonde",
    name: "Expensive Blonde",
    tone: "Soft, multi-dimensional blonde with blended roots for easier upkeep.",
    hex: "#E3CFA5",
    sources: ["Instagram stylists", "Salon menus"],
  },
  {
    id: "chocolate-cherry",
    name: "Chocolate Cherry",
    tone: "Rich brunette base with cherry red reflect, often used as a gloss over dark hair.",
    hex: "#5A242B",
    sources: ["Pinterest boards", "US color lines"],
  },
  {
    id: "mushroom-brunette",
    name: "Mushroom Brunette",
    tone: "Cool, ashy brunette with soft beige highlights, good bridge shade when going darker from blonde.",
    hex: "#7A6E63",
    sources: ["TikTok creators", "Salon trend lists"],
  },
  {
    id: "soft-black",
    name: "Soft Black",
    tone: "Almost-black with a softer edge than jet black, popular for gloss and root touch-ups.",
    hex: "#1F1B20",
    sources: ["US box dyes", "Amazon search"],
  },
  {                                                                                         id: "buttercream-blonde",
    name: "Buttercream Blonde",
    tone: "Warm, creamy blonde with golden reflect; often paired with bond-friendly lightener systems.",                                                                            hex: "#F0D7A5",
    sources: ["Salon promos", "US product lines"],
  },
  {                                                                                         id: "rich-auburn",
    name: "Rich Auburn",
    tone: "Balanced red-brown that flatters many skin tones and fades softly when maintained properly.",
    hex: "#9A3F28",
    sources: ["Pinterest US", "Seasonal campaigns"],
  },
];

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Optional: try to refine tone/hex/ordering with Grok Stylist.
 * If anything fails, we just return the base list.
 */
async function maybeEnrichWithGrok(
  env: Env,
  base: TrendItem[]
): Promise<TrendItem[]> {
  const url = env.GROK_STYLIST_URL;
  if (!url) return base;
                                                                                          try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Not a user-specific call; generic “system” request.
        "x-tier": "system",
      },
      body: JSON.stringify({
        mode: "trend-radar",                                                                    region: "US",
        // Give Grok a very tight lane: hair color + hair products only.
        instructions:
          "Return a JSON array of up to 10 hair color trends that are popular in the United States right now. " +
          "ONLY discuss hair colors and cosmetic hair products (no skin, no face, no medical or health advice). " +
          "For each trend, include: id (kebab-case), name, tone (1–2 sentences, cosmetic language only), " +
          "score (0–1, higher = hotter), optional hex hex code for a representative hair color, " +
          "and sources (array of short labels like 'TikTok US', 'Salon posts').",
        seed: base.map((b) => ({                                                                  id: b.id,
          name: b.name,                                                                           tone: b.tone,
          hex: b.hex,                                                                             sources: b.sources ?? [],
        })),
      }),
    });

    if (!res.ok) {
      console.warn("[trend-radar-cron] Grok stylist enrichment HTTP error", res.status);
      return base;
    }

    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : json;

    if (!Array.isArray(items)) return base;

    const enriched: TrendItem[] = items
      .map((it: any, idx: number) => ({
        id: String(it.id || base[idx]?.id || `trend-${idx}`),
        name: String(it.name || base[idx]?.name || `Trend ${idx + 1}`),
        tone: String(it.tone || base[idx]?.tone || ""),
        score: Math.max(
          0,
          Math.min(1, Number(it.score ?? base[idx]?.score ?? 0.7))
        ),
        hex: typeof it.hex === "string" ? it.hex : base[idx]?.hex,
        sources: Array.isArray(it.sources)
          ? it.sources.map((s: any) => String(s)).slice(0, 6)
          : base[idx]?.sources ?? [],
      }))
      // clamp to 10
      .slice(0, 10);
                                                                                            return enriched;
  } catch (err) {
    console.warn("[trend-radar-cron] Grok stylist enrichment failed", err);
    return base;
  }
}

/**
 * Optional: verify that each trend has at least some Amazon US hair-product
 * results via your amazon-search worker. If available, we just tag "Amazon"             * as an extra source label; no prices or inventory are stored here.
 */
async function maybeTagAmazon(env: Env, items: TrendItem[]): Promise<TrendItem[]> {
  const url = env.AMAZON_SEARCH_URL;
  if (!url) return items;

  const out: TrendItem[] = [];
  for (const trend of items) {
    try {
      const q = encodeURIComponent(trend.name + " hair dye");
      const res = await fetch(`${url}?q=${q}&country=US&category=hair`, {
        headers: { "x-tier": "system" },
      });

      if (!res.ok) {
        out.push(trend);
        continue;
      }

      const data = await res.json();
      const hasAny =
        Array.isArray(data?.items) && data.items.length > 0;

      if (hasAny) {
        const sources = Array.isArray(trend.sources) ? [...trend.sources] : [];
        if (!sources.includes("Amazon US")) sources.push("Amazon US");
        out.push({ ...trend, sources });
      } else {
        out.push(trend);
      }
    } catch (err) {
      console.warn("[trend-radar-cron] amazon-search tag error", err);
      out.push(trend);
    }
  }
  return out;
}

/**
 * Core refresh function:
 * - shuffle seed list
 * - assign scores
 * - optional Grok & Amazon enrichment
 * - write to KV
 */
async function refreshTrends(env: Env) {
  // 1) Start from seed trends (US-only, hair-only)
  const shuffled = [...SEED_TRENDS].sort(() => Math.random() - 0.5);

  let base: TrendItem[] = shuffled.map((t, idx) => {
    // basic descending heat (0.9 → 0.5) with small noise
    const baseScore = 0.9 - idx * 0.05;
    const jitter = (Math.random() - 0.5) * 0.05;
    return {
      id: t.id,
      name: t.name,
      tone: t.tone,
      hex: t.hex,
      sources: t.sources,
      score: Math.max(0.4, Math.min(1, baseScore + jitter)),
    };
  });

  // 2) Optional Grok enrichment (hair-only instructions)
  base = await maybeEnrichWithGrok(env, base);

  // 3) Optional Amazon tagging (hair products only)
  base = await maybeTagAmazon(env, base);                                               
  const payload: TrendPayload = {
    updatedAt: Date.now(),
    items: base.slice(0, 10),
  };

  await env.TREND_RADAR_KV.put(KV_KEY, JSON.stringify(payload));

  return payload;
}

export default {
  // Cron entrypoint
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(                                                                            (async () => {
        try {
          const data = await refreshTrends(env);
          console.log("[trend-radar-cron] refreshed", {
            count: data.items.length,
            updatedAt: data.updatedAt,
          });                                                                                   } catch (err) {
          console.error("[trend-radar-cron] refresh error", err);
        }
      })()                                                                                  );
  },

  // Optional: manual trigger for testing (POST /trend-radar-cron/refresh)
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/trend-radar-cron/refresh" && request.method === "POST") {
      try {
        const data = await refreshTrends(env);
        return json({ ok: true, refreshed: true, updatedAt: data.updatedAt });
      } catch (err) {
        console.error("[trend-radar-cron] manual refresh error", err);                          return json({ ok: false, error: "refresh_failed" }, 500);
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
