import { guardRequest } from '../../lib/guard';
import { logUsage } from '../../lib/telemetry';

export default {
  async fetch(req: Request, env: any, ctx: ExecutionContext) {
    const started = Date.now();
    const uid = req.headers.get('x-user-id') || req.headers.get('x-firebase-uid') || '';
    const tier = (req.headers.get('x-tier') || 'unknown').toLowerCase();

    // 🔧 CHANGE THESE PER WORKER
    const endpoint = '/REPLACE_ME';
    const featureTag: 'scan' | 'explain' | 'rerank' | 'chat' = 'explain';
    const priority: 'core' | 'experience' = 'experience';

    const decision = await guardRequest(req, env, {
      endpoint,
      featureTag,
      priority,
      estimatedCostCents: priority === 'core' ? 2 : 1,
    });

    if (!decision.ok) {
      return new Response(
        JSON.stringify({ ok: false, reason: decision.reason, retryAfterSec: decision.retryAfterSec ?? null }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...(decision.headers ?? {}) } }
      );
    }

    try {
      // ✅ REAL WORKER LOGIC GOES HERE
      // Use decision.mode to degrade:
      // - "full": normal
      // - "degraded": smaller/cheaper response
      // - "cached": return cache/static fallback when possible

      const payload = { ok: true, mode: decision.mode };

      const res = new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      if (uid) {
        ctx.waitUntil(
          logUsage(env, uid, {
            endpoint,
            tier,
            featureTag,
            priority,
            mode: decision.mode,
            ok: true,
            latencyMs: Date.now() - started,
            status: 200,
          })
        );
      }

      return res;
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : 'worker_error';

      if (uid) {
        ctx.waitUntil(
          logUsage(env, uid, {
            endpoint,
            tier,
            featureTag,
            priority,
            mode: decision.mode,
            ok: false,
            latencyMs: Date.now() - started,
            status: 500,
            note: msg.slice(0, 140),
          })
        );
      }

      return new Response(JSON.stringify({ ok: false, error: msg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
