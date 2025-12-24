// workers/amazon-search.ts
// OmniTintAI - Amazon PA-API v5 Worker (Hero + Recommend + Product)
// Uses server-side guards + caching to stay under quota and remain compliant.

import { guardRequest } from './lib/guard';
import { logUsage } from './lib/telemetry';

interface Env {
  OMNI_GUARD_KV: KVNamespace;

  AMAZON_ACCESS_KEY: string;
  AMAZON_SECRET_KEY: string;
  AMAZON_PARTNER_TAG: string;
}

const HOST = 'webservices.amazon.com';
const PATH = '/paapi5/searchitems';
const REGION = 'us-east-1';
const SERVICE = 'ProductAdvertisingAPI';

function dayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}

function ttlSeconds(seconds: number) {
  return Math.max(60, Math.floor(seconds));
}

function norm(s: string) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, '_').slice(0, 60);
}

// --- Minimal “monthly-ish” cap implemented as daily cap (safer for V1)
// If you’re targeting ~8k/month, a safe daily ceiling is ~250/day.
async function checkAmazonDailyCap(env: Env): Promise<{ ok: boolean; used: number; limit: number }> {
  const day = dayKeyUTC();
  const k = `amazon:daily:${day}:calls`;
  const used = Number((await env.OMNI_GUARD_KV.get(k)) || '0') || 0;
  const limit = 250; // ✅ V1 SAFE DEFAULT (adjust if your quota differs)
  return { ok: used < limit, used, limit };
}

async function incrAmazonDaily(env: Env) {
  const day = dayKeyUTC();
  const k = `amazon:daily:${day}:calls`;
  const cur = Number((await env.OMNI_GUARD_KV.get(k)) || '0') || 0;
  // expire in ~2 days to avoid KV pileup
  await env.OMNI_GUARD_KV.put(k, String(cur + 1), { expirationTtl: 172800 });
}

// ---------- AWS SigV4 helpers (PA-API v5 requires this) ----------
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(k => crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data)));
}

async function getSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode('AWS4' + secret), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  return kSigning;
}

function amzDate(now = new Date()) {
  // YYYYMMDD'T'HHMMSS'Z'
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return iso;
}

async function signPaapiRequest(env: Env, payload: any): Promise<Response> {
  const now = new Date();
  const amzDt = amzDate(now);
  const dateStamp = amzDt.slice(0, 8);

  const body = JSON.stringify(payload);
  const hashedPayload = await sha256Hex(body);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${HOST}\n` +
    `x-amz-date:${amzDt}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest =
    `POST\n${PATH}\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;

  const hashedCanonicalRequest = await sha256Hex(canonicalRequest);

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDt}\n${credentialScope}\n${hashedCanonicalRequest}`;

  const signingKey = await getSigningKey(env.AMAZON_SECRET_KEY, dateStamp, REGION, SERVICE);
  const signatureBuf = await hmac(signingKey, stringToSign);
  const signature = [...new Uint8Array(signatureBuf)].map(b => b.toString(16).padStart(2, '0')).join('');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${env.AMAZON_ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`https://${HOST}${PATH}`, {
    method: 'POST',
    headers: {
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=utf-8',
      'host': HOST,
      'x-amz-date': amzDt,
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      'Authorization': authorization,
    },
    body,
  });
}

// ---------- Response shaping (don’t expose raw PA-API) ----------
function shapeItems(json: any) {
  const items = json?.SearchResult?.Items || [];
  return items.map((it: any) => ({
    asin: it?.ASIN,
    title: it?.ItemInfo?.Title?.DisplayValue,
    brand: it?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
    image: it?.Images?.Primary?.Medium?.URL || it?.Images?.Primary?.Small?.URL,
    // keep link server-generated or use DetailPageURL if returned:
    url: it?.DetailPageURL,
  })).filter((x: any) => x.asin && x.title && x.image);
}

// ---------- Main ----------
export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = Date.now();
    const url = new URL(req.url);

    // headers from app
    const uid = req.headers.get('x-user-id') || req.headers.get('x-firebase-uid') || '';
    const tier = (req.headers.get('x-tier') || 'unknown').toLowerCase();

    // type: hero | recommend | product
    const type = (url.searchParams.get('type') || 'hero').toLowerCase();

    // 1) Worker guard (tier-aware, server-side unbypassable)
    const decision = await guardRequest(req as any, env as any, {
      endpoint: '/amazon-search',
      featureTag: 'rerank',          // treat Amazon as “expensive-ish”
      priority: 'experience',        // throttle first vs scan core
      estimatedCostCents: 0,         // this is not AI spend; keep 0 here
    });

    if (!decision.ok) {
      return new Response(JSON.stringify({ ok: false, reason: decision.reason, retryAfterSec: decision.retryAfterSec ?? null }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...(decision.headers ?? {}) },
      });
    }

    // 2) Amazon daily cap (global) — prevents hitting 8k/mo
    const cap = await checkAmazonDailyCap(env);
    if (!cap.ok) {
      // cached-only behavior
      // We'll try to serve cache if present based on request key; otherwise 429-ish response
      return new Response(JSON.stringify({
        ok: false,
        reason: 'amazon_daily_cap_reached',
        usedToday: cap.used,
        dailyLimit: cap.limit,
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // 3) Build cache key + TTL policy
    let cacheKey = '';
    let ttl = 1800; // default 30m

    if (type === 'hero') {
      const area = norm(url.searchParams.get('area') || 'default');
      cacheKey = `amazon:hero:v1:${area}`;
      ttl = 60 * 60 * 12; // 12h
    } else if (type === 'recommend') {
      // normalize preference combos to avoid fragmentation
      const tone = norm(url.searchParams.get('tone') || 'neutral'); // warm/cool/bold/neutral
      const goal = norm(url.searchParams.get('goal') || 'default');
      const sensitivity = norm(url.searchParams.get('sensitivity') || 'none');
      cacheKey = `amazon:rec:v1:tone=${tone}|goal=${goal}|sens=${sensitivity}`;
      ttl = 60 * 30; // 30m
    } else if (type === 'product') {
      const asin = norm(url.searchParams.get('asin') || '');
      if (!asin) return new Response(JSON.stringify({ ok: false, reason: 'missing_asin' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      cacheKey = `amazon:product:v1:${asin}`;
      ttl = 60 * 15; // 15m
    } else {
      return new Response(JSON.stringify({ ok: false, reason: 'invalid_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 4) Cache lookup
    const cached = await env.OMNI_GUARD_KV.get(cacheKey);
    if (cached) {
      // log and return
      if (uid) {
        ctx.waitUntil(logUsage(env as any, uid, {
          endpoint: '/amazon-search',
          tier,
          featureTag: `amazon_${type}`,
          priority: 'experience',
          mode: 'cached',
          ok: true,
          latencyMs: Date.now() - started,
          status: 200,
          cacheHit: true,
        }));
      }
      return new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 5) Build PA-API query
    // NOTE: Keep it simple for V1. Use Keywords search; later you can tighten SearchIndex etc.
    let keywords = 'hair dye';
    if (type === 'hero') {
      const area = url.searchParams.get('area') || 'hair dye';
      keywords = `hair dye ${area}`;
    } else if (type === 'recommend') {
      const tone = url.searchParams.get('tone') || '';
      keywords = `hair dye ${tone}`;
    } else if (type === 'product') {
      // For product-by-ASIN, PA-API uses GetItems endpoint ideally.
      // V1 quick workaround: search by ASIN keyword (works but not perfect).
      const asin = url.searchParams.get('asin') || '';
      keywords = asin;
    }

    const payload = {
      Keywords: keywords,
      SearchIndex: 'Beauty',
      PartnerTag: env.AMAZON_PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
      ItemCount: 12,
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'Images.Primary.Medium',
        'Images.Primary.Small',
      ],
    };

    // 6) Call Amazon (counts toward quota)
    await incrAmazonDaily(env);
    const amazonRes = await signPaapiRequest(env, payload);
    const text = await amazonRes.text();

    if (!amazonRes.ok) {
      // Don’t cache errors; return safe payload
      if (uid) {
        ctx.waitUntil(logUsage(env as any, uid, {
          endpoint: '/amazon-search',
          tier,
          featureTag: `amazon_${type}`,
          priority: 'experience',
          mode: 'full',
          ok: false,
          latencyMs: Date.now() - started,
          status: amazonRes.status,
          note: text.slice(0, 120),
        }));
      }
      return new Response(JSON.stringify({ ok: false, status: amazonRes.status }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const json = JSON.parse(text);
    const shaped = { ok: true, type, items: shapeItems(json) };

    const out = JSON.stringify(shaped);
    await env.OMNI_GUARD_KV.put(cacheKey, out, { expirationTtl: ttlSeconds(ttl) });

    if (uid) {
      ctx.waitUntil(logUsage(env as any, uid, {
        endpoint: '/amazon-search',
        tier,
        featureTag: `amazon_${type}`,
        priority: 'experience',
        mode: 'full',
        ok: true,
        latencyMs: Date.now() - started,
        status: 200,
        cacheHit: false,
      }));
    }

    return new Response(out, { status: 200, headers: { 'Content-Type': 'application/json' } });
  },
};
