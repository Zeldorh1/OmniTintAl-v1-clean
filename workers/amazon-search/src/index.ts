// workers/amazon-search/src/index.ts
// Amazon PA-API v5 (SearchItems) with:
// - server-side guardRequest (tier caps)
// - global daily Amazon call cap (protect 8k/mo)
// - cache: hero (12h global) + recommend (30m by prefs) + simple?q= (30m)
// - does NOT expose raw PA-API JSON

import { guardRequest } from "../../lib/guard";
import { logUsage } from "../../lib/telemetry";

interface Env {
  OMNI_GUARD_KV: KVNamespace;
  AMAZON_ACCESS_KEY: string;
  AMAZON_SECRET_KEY: string;
  AMAZON_PARTNER_TAG: string;
}

const HOST = "webservices.amazon.com";
const PATH = "/paapi5/searchitems";
const REGION = "us-east-1";
const SERVICE = "ProductAdvertisingAPI";

function dayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}
function ttlSeconds(sec: number) {
  return Math.max(60, Math.floor(sec));
}
function norm(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, "_").slice(0, 80);
}

function getUid(req: Request) {
  return req.headers.get("x-user-id") || req.headers.get("x-firebase-uid") || "";
}
function getTier(req: Request) {
  return (req.headers.get("x-tier") || "unknown").toLowerCase();
}

// ---- Global daily Amazon cap (safety) ----
// If you’re planning around ~8k/mo, use ~250/day as the hard ceiling.
const AMAZON_DAILY_CAP = 250;

async function amazonCapOk(env: Env) {
  const k = `amazon:calls:${dayKeyUTC()}`;
  const used = Number((await env.OMNI_GUARD_KV.get(k)) || "0") || 0;
  return { ok: used < AMAZON_DAILY_CAP, used, key: k };
}
async function amazonCapIncr(env: Env, key: string) {
  const cur = Number((await env.OMNI_GUARD_KV.get(key)) || "0") || 0;
  await env.OMNI_GUARD_KV.put(key, String(cur + 1), { expirationTtl: 172800 });
}

// ---------- SigV4 helpers ----------
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacRaw(
  key: ArrayBuffer | Uint8Array,
  data: string
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function getSigningKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string
) {
  const kDate = await hmacRaw(
    new TextEncoder().encode("AWS4" + secret),
    dateStamp
  );
  const kRegion = await hmacRaw(kDate, region);
  const kService = await hmacRaw(kRegion, service);
  const kSigning = await hmacRaw(kService, "aws4_request");
  return kSigning;
}

function amzDate(now = new Date()) {
  // YYYYMMDDTHHMMSSZ
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function paapiSearchItems(env: Env, payload: any): Promise<Response> {
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

  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = `POST\n${PATH}\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;

  const hashedCanonicalRequest = await sha256Hex(canonicalRequest);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;

  const stringToSign = `AWS4-HMAC-SHA256\n${amzDt}\n${credentialScope}\n${hashedCanonicalRequest}`;

  const signingKey = await getSigningKey(
    env.AMAZON_SECRET_KEY,
    dateStamp,
    REGION,
    SERVICE
  );
  const signatureBuf = await hmacRaw(signingKey, stringToSign);
  const signature = [...new Uint8Array(signatureBuf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${env.AMAZON_ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`https://${HOST}${PATH}`, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host: HOST,
      "x-amz-date": amzDt,
      "x-amz-target":
        "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      Authorization: authorization,
    },
    body,
  });
}

// Only return what app needs (safer + less scrape bait)
function shapeItems(json: any) {
  const items = json?.SearchResult?.Items || [];
  return items
    .map((it: any) => ({
      asin: it?.ASIN,
      title: it?.ItemInfo?.Title?.DisplayValue,
      brand: it?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      image:
        it?.Images?.Primary?.Medium?.URL ||
        it?.Images?.Primary?.Small?.URL,
      url: it?.DetailPageURL,
    }))
    .filter((x: any) => x.asin && x.title && x.image);
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = Date.now();
    const url = new URL(req.url);

    const uid = getUid(req);
    const tier = getTier(req);

    // NEW: simple mode for q=… (used by trend-radar-cron)
    const simpleQuery = (url.searchParams.get("q") || "").trim();
    const simpleMode = !!simpleQuery;

    // type=hero | recommend | simple
    let type = (url.searchParams.get("type") || "hero").toLowerCase();
    if (simpleMode) type = "simple";

    // 1) Tier guard (free hard caps / premium higher)
    const decision = await guardRequest(req, env as any, {
      endpoint: "/amazon-search",
      featureTag: "rerank", // treat Amazon as “expensive-ish”
      priority: "experience", // throttle before core scan ingestion
      estimatedCostCents: 0,
    });

    if (!decision.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          reason: decision.reason,
          retryAfterSec: decision.retryAfterSec ?? null,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...(decision.headers ?? {}),
          },
        }
      );
    }

    // 2) Global daily Amazon cap
    const cap = await amazonCapOk(env);
    if (!cap.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          reason: "amazon_daily_cap",
          usedToday: cap.used,
          dailyLimit: AMAZON_DAILY_CAP,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3) Cache key + TTL
    let cacheKey = "";
    let ttl = 60 * 30; // 30m default

    if (simpleMode) {
      cacheKey = `amazon:simple:v1:q=${norm(simpleQuery).slice(0, 60)}`;
      ttl = 60 * 30;
    } else if (type === "hero") {
      const area = norm(url.searchParams.get("area") || "default");
      cacheKey = `amazon:hero:v1:${area}`;
      ttl = 60 * 60 * 12; // 12h
    } else if (type === "recommend") {
      const tone = norm(url.searchParams.get("tone") || "neutral");
      const goal = norm(url.searchParams.get("goal") || "default");
      const sensitivity = norm(
        url.searchParams.get("sensitivity") || "none"
      );
      cacheKey = `amazon:rec:v1:tone=${tone}|goal=${goal}|sens=${sensitivity}`;
      ttl = 60 * 30; // 30m
    } else {
      return new Response(
        JSON.stringify({ ok: false, reason: "invalid_type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cached = await env.OMNI_GUARD_KV.get(cacheKey);
    if (cached) {
      if (uid)
        ctx.waitUntil(
          logUsage(env as any, uid, {
            endpoint: "/amazon-search",
            tier,
            featureTag: `amazon_${type}`,
            priority: "experience",
            mode: "cached",
            ok: true,
            latencyMs: Date.now() - started,
            status: 200,
            cacheHit: true,
          })
        );
      return new Response(cached, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4) Build query
    let keywords = "hair dye";
    if (simpleMode) {
      keywords = simpleQuery;
    } else if (type === "hero") {
      const area = url.searchParams.get("area") || "hair dye";
      keywords = `hair dye ${area}`;
    } else if (type === "recommend") {
      const tone = url.searchParams.get("tone") || "";
      keywords = `hair dye ${tone}`.trim();
    }

    const payload = {
      Keywords: keywords,
      SearchIndex: "Beauty",
      PartnerTag: env.AMAZON_PARTNER_TAG,
      PartnerType: "Associates",
      Marketplace: "www.amazon.com",
      ItemCount: 12,
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.ByLineInfo",
        "Images.Primary.Medium",
        "Images.Primary.Small",
      ],
    };

    // 5) Call Amazon (counts toward cap)
    await amazonCapIncr(env, cap.key);
    const amazonRes = await paapiSearchItems(env, payload);
    const raw = await amazonRes.text();

    if (!amazonRes.ok) {
      if (uid)
        ctx.waitUntil(
          logUsage(env as any, uid, {
            endpoint: "/amazon-search",
            tier,
            featureTag: `amazon_${type}`,
            priority: "experience",
            mode: "full",
            ok: false,
            latencyMs: Date.now() - started,
            status: amazonRes.status,
            note: raw.slice(0, 120),
          })
        );
      return new Response(
        JSON.stringify({ ok: false, status: amazonRes.status }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const json = JSON.parse(raw);
    const out = JSON.stringify({ ok: true, type, items: shapeItems(json) });

    await env.OMNI_GUARD_KV.put(cacheKey, out, {
      expirationTtl: ttlSeconds(ttl),
    });

    if (uid)
      ctx.waitUntil(
        logUsage(env as any, uid, {
          endpoint: "/amazon-search",
          tier,
          featureTag: `amazon_${type}`,
          priority: "experience",
          mode: "full",
          ok: true,
          latencyMs: Date.now() - started,
          status: 200,
          cacheHit: false,
        })
      );

    return new Response(out, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
