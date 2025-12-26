// workers/trend-radar/index.ts
// V1 · TREND RADAR · READ-ONLY
//
// Serves the latest cached hair-color trends for TrendRadarScreen.
// Data is written by the trend-radar-cron worker into KV.
//
// Response shape matches the app:                                                      // {
//   updatedAt: number | null;
//   items: { id, name, tone, score, hex?, sources?[] }[]
// }
                                                                                        export interface Env {                                                                    TREND_RADAR_KV: KVNamespace;
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
  updatedAt: number | null;                                                               items: TrendItem[];                                                                   };

const KV_KEY = "TREND_RADAR_LATEST";

function json(data: any, status = 200) {                                                  return new Response(JSON.stringify(data), {                                               status,                                                                                 headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",                                                          },                                                                                    });                                                                                   }
                                                                                        export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only handle /trend-radar; anything else 404s
    if (url.pathname !== "/trend-radar") {
      return new Response("Not found", { status: 404 });
    }

    try {
      const stored = await env.TREND_RADAR_KV.get<TrendPayload>(KV_KEY, "json");

      if (!stored || !Array.isArray(stored.items)) {
        // Safe fallback: empty payload, app will show "no trends yet"
        const empty: TrendPayload = { updatedAt: null, items: [] };
        return json(empty);
      }

      // Hard clamp values for safety
      const clamped: TrendPayload = {
        updatedAt: typeof stored.updatedAt === "number" ? stored.updatedAt : null,
        items: stored.items
          .filter((it) => typeof it?.id === "string" && typeof it?.name === "string")             .map((it) => ({                                                                           id: String(it.id),
            name: String(it.name),
            tone: String(it.tone ?? ""),
            score: Math.max(0, Math.min(1, Number(it.score ?? 0))),                                 hex: it.hex,
            sources: Array.isArray(it.sources)
              ? it.sources.map((s) => String(s)).slice(0, 6)                                          : [],
          })),
      };

      return json(clamped);
    } catch (err) {
      console.error("[trend-radar] KV read error", err);
      const fallback: TrendPayload = { updatedAt: null, items: [] };
      return json(fallback, 200);
    }
  },
};
