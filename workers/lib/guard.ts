// workers/lib/guard.ts
// OmniTintAI — Server-side Guard Kit (Global Budget + Tier Limits + Cooldowns)
// Drop-in, shared across all workers.

export type Tier = 'free' | 'premium' | 'unknown';
export type Priority = 'core' | 'experience';

export interface GuardEnv {
  OMNI_GUARD_KV: KVNamespace;
  ADMIN_BYPASS_KEY?: string;
}

export interface GuardContext {
  uid: string;                 // Firebase UID (anon or full)
  tier: Tier;                  // free/premium
  endpoint: string;            // '/grok-stylist', '/ml-hair-brain', etc.
  featureTag: string;          // 'scan', 'explain', 'rerank', 'chat', etc.
  priority: Priority;          // 'core' (flywheel) or 'experience' (throttle-first)
  estimatedCostCents?: number; // optional budget estimate. if unknown, use 1-3 cents conservative
}

export interface GuardDecision {
  ok: boolean;
  mode: 'full' | 'degraded' | 'cached' | 'blocked';
  reason?: string;
  retryAfterSec?: number;
  headers?: Record<string, string>;
}

/**
 * =========================
 * CONFIG — ADJUST HERE ONLY
 * =========================
 */
const CONFIG = {
  // Global budgets (cents/day). Split into protected Core vs Experience.
  globalBudgetCents: {
    core: 1500,       // $15/day reserved for scans -> central brain (adjust)
    experience: 1500, // $15/day for chat/explanations (adjust)
  },

  // Budget behavior thresholds
  budgetThresholds: {
    degradeAt: 0.70,  // 70% -> degrade experience
    cacheAt: 0.85,    // 85% -> cached-only
    premiumOnlyAt: 0.95, // 95% -> block free experience calls
    hardStopAt: 1.00, // 100% -> stop that budget class
  },

  // FREE tier hard caps (per user per day)
  freeCaps: {
    totalActionsPerDay: 3,  // across all endpoints
    scansPerDay: 1,
    expensiveActionsPerDay: 2, // scan/explain/rerank group
  },

  // PREMIUM caps (generous, still safe)
  premiumCaps: {
    totalActionsPerDay: 100, // hidden fair use
    scansPerDay: 10,
    expensiveActionsPerDay: 40,
  },

  // Cooldowns (seconds) for costly actions
  cooldownSec: {
    scan: 60 * 10,      // 10 minutes between scans
    explain: 15,        // avoid spam tapping
    rerank: 30,
  },

  // Anti-abuse: if UID missing, treat as unknown/free
  requireUid: true,

  // Key prefixes
  keys: {
    day: () => new Date().toISOString().slice(0, 10), // YYYY-MM-DD (UTC)
  },
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeHash(input: string) {
  // Not cryptographic; used only to avoid plain UID in KV keys.
  // If you want stronger, swap to SHA-256 using WebCrypto.
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function getTierFromRequest(req: Request): Tier {
  // You can wire this to your premium validation later.
  const t = req.headers.get('x-tier')?.toLowerCase();
  if (t === 'premium') return 'premium';
  if (t === 'free') return 'free';
  return 'unknown';
}

function getUidFromRequest(req: Request): string | null {
  // Prefer Firebase UID passed from client
  const uid = req.headers.get('x-user-id') || req.headers.get('x-firebase-uid');
  return uid && uid.length >= 6 ? uid : null;
}

function isAdminBypass(req: Request, env: GuardEnv): boolean {
  const key = req.headers.get('x-admin-bypass');
  return !!env.ADMIN_BYPASS_KEY && !!key && key === env.ADMIN_BYPASS_KEY;
}

async function kvGetInt(kv: KVNamespace, key: string): Promise<number> {
  const v = await kv.get(key);
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function kvPutInt(kv: KVNamespace, key: string, val: number, ttlSec: number) {
  await kv.put(key, String(clampInt(val, 0, 2_000_000_000)), { expirationTtl: ttlSec });
}

async function kvIncr(kv: KVNamespace, key: string, inc: number, ttlSec: number): Promise<number> {
  // KV has no atomic incr; we do best-effort. For strict atomicity, use Durable Objects.
  // For your scale targets (V1/V2) this is fine.
  const cur = await kvGetInt(kv, key);
  const next = cur + inc;
  await kvPutInt(kv, key, next, ttlSec);
  return next;
}

function ttlUntilEndOfDayUTC(): number {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 5)); // 5s after midnight
  return Math.max(60, Math.floor((end.getTime() - now.getTime()) / 1000));
}

function capFor(tier: Tier) {
  return tier === 'premium' ? CONFIG.premiumCaps : CONFIG.freeCaps;
}

function isExpensive(featureTag: string) {
  return featureTag === 'scan' || featureTag === 'explain' || featureTag === 'rerank';
}

function cooldownFor(featureTag: string): number {
  return (CONFIG.cooldownSec as any)[featureTag] ?? 0;
}

export async function guardRequest(
  req: Request,
  env: GuardEnv,
  ctx: Omit<GuardContext, 'tier' | 'uid'> & Partial<Pick<GuardContext, 'tier' | 'uid'>>
): Promise<GuardDecision> {
  // Admin bypass (for your testing only)
  if (isAdminBypass(req, env)) return { ok: true, mode: 'full' };

  const tier = ctx.tier ?? getTierFromRequest(req);
  const uid = ctx.uid ?? getUidFromRequest(req) ?? (CONFIG.requireUid ? null : 'anon');

  if (!uid) {
    return {
      ok: false,
      mode: 'blocked',
      reason: 'missing_uid',
      retryAfterSec: 60,
    };
  }

  const day = CONFIG.keys.day();
  const uidHash = safeHash(uid);
  const ttl = ttlUntilEndOfDayUTC();

  // 1) Cooldown check (per user per feature)
  const cd = cooldownFor(ctx.featureTag);
  if (cd > 0) {
    const cdKey = `cd:${day}:${uidHash}:${ctx.featureTag}`;
    const lastTs = await env.OMNI_GUARD_KV.get(cdKey);
    const now = Date.now();
    if (lastTs) {
      const last = Number(lastTs);
      if (Number.isFinite(last)) {
        const elapsed = Math.floor((now - last) / 1000);
        if (elapsed < cd) {
          return {
            ok: false,
            mode: 'blocked',
            reason: 'cooldown',
            retryAfterSec: cd - elapsed,
            headers: { 'Retry-After': String(cd - elapsed) },
          };
        }
      }
    }
    await env.OMNI_GUARD_KV.put(cdKey, String(now), { expirationTtl: ttl });
  }

  // 2) Per-user daily caps
  const caps = capFor(tier);
  const totalKey = `u:${day}:${uidHash}:total`;
  const expensiveKey = `u:${day}:${uidHash}:expensive`;
  const scansKey = `u:${day}:${uidHash}:scans`;

  const total = await kvGetInt(env.OMNI_GUARD_KV, totalKey);
  if (total >= caps.totalActionsPerDay) {
    return { ok: false, mode: 'blocked', reason: 'daily_cap_total', retryAfterSec: ttl };
  }

  if (isExpensive(ctx.featureTag)) {
    const exp = await kvGetInt(env.OMNI_GUARD_KV, expensiveKey);
    if (exp >= caps.expensiveActionsPerDay) {
      return { ok: false, mode: 'blocked', reason: 'daily_cap_expensive', retryAfterSec: ttl };
    }
  }

  if (ctx.featureTag === 'scan') {
    const s = await kvGetInt(env.OMNI_GUARD_KV, scansKey);
    if (s >= caps.scansPerDay) {
      return { ok: false, mode: 'blocked', reason: 'daily_cap_scans', retryAfterSec: ttl };
    }
  }

  // 3) Global budget by priority class
  const pr: Priority = ctx.priority;
  const globalKey = `gb:${day}:${pr}`;
  const usedCents = await kvGetInt(env.OMNI_GUARD_KV, globalKey);
  const budgetCents = CONFIG.globalBudgetCents[pr];

  const frac = budgetCents > 0 ? usedCents / budgetCents : 1;

  // Determine behavior based on thresholds
  // - Core should degrade later (keep it alive)
  // - Experience degrades sooner
  let mode: GuardDecision['mode'] = 'full';

  if (frac >= CONFIG.budgetThresholds.hardStopAt) {
    // If core is out, hard stop core. If experience is out, stop experience.
    return { ok: false, mode: 'blocked', reason: `global_budget_${pr}_exhausted`, retryAfterSec: ttl };
  }

  // If experience budget is tight: degrade progressively.
  if (pr === 'experience') {
    if (frac >= CONFIG.budgetThresholds.premiumOnlyAt && tier !== 'premium') {
      return { ok: false, mode: 'blocked', reason: 'global_budget_premium_only', retryAfterSec: ttl };
    }
    if (frac >= CONFIG.budgetThresholds.cacheAt) mode = 'cached';
    else if (frac >= CONFIG.budgetThresholds.degradeAt) mode = 'degraded';
  }

  // Core budget: we still can choose to degrade responses but MUST allow scan ingestion
  // If core is tight, you can return degraded mode but still ok.
  if (pr === 'core') {
    if (frac >= CONFIG.budgetThresholds.cacheAt) mode = 'degraded';
  }

  // 4) Commit the counters (best-effort)
  await kvIncr(env.OMNI_GUARD_KV, totalKey, 1, ttl);
  if (isExpensive(ctx.featureTag)) await kvIncr(env.OMNI_GUARD_KV, expensiveKey, 1, ttl);
  if (ctx.featureTag === 'scan') await kvIncr(env.OMNI_GUARD_KV, scansKey, 1, ttl);

  // 5) Reserve budget (best-effort)
  const est = clampInt(ctx.estimatedCostCents ?? (pr === 'core' ? 2 : 1), 0, 100);
  await kvIncr(env.OMNI_GUARD_KV, globalKey, est, ttl);

  return { ok: true, mode };
}
