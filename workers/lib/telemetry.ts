// workers/lib/telemetry.ts
export interface TelemetryEnv {
  OMNI_GUARD_KV: KVNamespace;
}

export interface UsageLog {
  ts: number;
  uidHash: string;
  endpoint: string;
  tier: string;
  featureTag: string;
  priority: string;
  mode: string;
  ok: boolean;
  latencyMs?: number;
  status?: number;
  cacheHit?: boolean;
  note?: string;
}

function safeHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function ttlUntilEndOfDayUTC(): number {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 5));
  return Math.max(60, Math.floor((end.getTime() - now.getTime()) / 1000));
}

export async function logUsage(env: TelemetryEnv, uid: string, log: Omit<UsageLog, 'ts' | 'uidHash'>) {
  const day = new Date().toISOString().slice(0, 10);
  const uidHash = safeHash(uid);
  const ts = Date.now();
  const ttl = ttlUntilEndOfDayUTC();

  // Store small per-day rollups (cheap, queryable)
  const base = `tl:${day}`;
  const key = `${base}:${uidHash}:${ts}:${Math.floor(Math.random() * 1e6)}`;

  await env.OMNI_GUARD_KV.put(
    key,
    JSON.stringify({ ts, uidHash, ...log }),
    { expirationTtl: ttl }
  );

  // Quick aggregates
  const agg1 = `agg:${day}:endpoint:${log.endpoint}`;
  const agg2 = `agg:${day}:tier:${log.tier}`;
  const agg3 = `agg:${day}:feature:${log.featureTag}`;
  // best-effort increments via get+put is fine in V1/V2
  await incr(env.OMNI_GUARD_KV, agg1, 1, ttl);
  await incr(env.OMNI_GUARD_KV, agg2, 1, ttl);
  await incr(env.OMNI_GUARD_KV, agg3, 1, ttl);
}

async function incr(kv: KVNamespace, key: string, inc: number, ttl: number) {
  const cur = Number(await kv.get(key) || '0');
  const next = (Number.isFinite(cur) ? cur : 0) + inc;
  await kv.put(key, String(next), { expirationTtl: ttl });
}
