// V1 · COLOR ANALYZER · HAIR SCAN FACADE
//
// - Entry point the app calls for hair scans.
// - Wraps guardRequest (rate limiting via RATE_LIMIT_KV).
// - Proxies to your gemini-lite worker if GEMINI_LITE_URL is set.
// - Never stores images; just passes them through once.

import { guardRequest } from "../../lib/guard";

type ScanRequest = {
  imageBase64: string;
  skinToneHint?: string;
};

type ScanResponse = {
  ok: boolean;
  hex?: string;
  lightFactor?: number;
  style?: string;
  reason?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(req: Request, env: any, _ctx: ExecutionContext): Promise<Response> {
    if (req.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    // Guard + rate limit first (uses RATE_LIMIT_KV → OMNI_LIMITS_KV)
    const decision: any = await guardRequest(req, env, {
      endpoint: "/color-analyzer",
      featureTag: "scan",       // scan | explain | chat | rerank
      priority: "core",         // core = hair scan is critical path
      estimatedCostCents: 2,
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

    let body: ScanRequest;
    try {
      body = (await req.json()) as ScanRequest;
    } catch {
      return json({ ok: false, error: "invalid_json" }, 400);
    }

    const raw = (body?.imageBase64 || "").trim();
    if (!raw || raw.length < 100) {
      return json({ ok: false, error: "missing_image" }, 400);
    }
    // Hard safety: cap payload size (just in case)
    if (raw.length > 2_000_000) {
      return json({ ok: false, error: "image_too_large" }, 413);
    }

    // If you’ve wired gemini-lite, we proxy to it.
    const geminiUrl = env.GEMINI_LITE_URL as string | undefined;

    if (!geminiUrl) {
      // Safe fallback: return a neutral “we couldn’t scan” result
      const fallback: ScanResponse = {
        ok: false,
        reason: "gemini_not_configured",
      };
      return json(fallback, 503);
    }

    try {
      const res = await fetch(`${geminiUrl}/scan-hair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // System-level call; no per-user identifiers passed through.
          "x-tier": "system",
        },
        body: JSON.stringify({
          imageBase64: raw,
          skinToneHint: body.skinToneHint || null,
        }),
      });

      if (!res.ok) {
        return json(
          { ok: false, error: "upstream_error", status: res.status },
          502
        );
      }

      const data = (await res.json()) as ScanResponse;

      // Hard clamp/shape before returning to the app
      const out: ScanResponse = {
        ok: !!data.ok,
        hex: typeof data.hex === "string" ? data.hex : undefined,
        lightFactor:
          typeof data.lightFactor === "number"
            ? Math.max(0, Math.min(1.5, data.lightFactor))
            : undefined,
        style: typeof data.style === "string" ? data.style.slice(0, 200) : undefined,
        reason: typeof data.reason === "string" ? data.reason.slice(0, 200) : undefined,
      };

      return json(out);
    } catch (err) {
      console.error("[color-analyzer] upstream error", err);
      return json({ ok: false, error: "internal_error" }, 500);
    }
  },
};
