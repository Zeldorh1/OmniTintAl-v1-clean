// client/src/brain/events.ts
// Thin wrappers so screens don’t handcraft event payloads differently.

import { uid } from "../utils/uuid";
import { logEvent } from "../utils/eventLogger";
import { BRAIN_CONTRACT_VERSION } from "./omniBrainContract";

export async function logPersonalizationSaved(profile: any) {
  await logEvent({
    v: BRAIN_CONTRACT_VERSION,
    id: uid(),
    type: "personalization.saved",
    ts: Date.now(),
    payload: { profile },
  } as any);
}

export async function logScanCompleted(params: {
  scanId?: string;
  metrics: Record<string, number>;
  flags?: string[];
  confidence?: "low" | "medium" | "high";
  deltaFromPrev?: Record<string, number>;
  confirmations?: Record<string, any>;
}) {
  await logEvent({
    v: BRAIN_CONTRACT_VERSION,
    id: uid(),
    type: "scan.completed",
    ts: Date.now(),
    payload: {
      scanId: params.scanId || uid(),
      metrics: params.metrics,
      flags: params.flags || [],
      confidence: params.confidence || "medium",
      deltaFromPrev: params.deltaFromPrev,
      confirmations: params.confirmations,
    },
  } as any);
}

export async function logProductUsed(params: {
  id: string;
  name?: string;
  brand?: string;
  tags?: string[];
  source?: "amazon" | "bundle" | "manual";
  step?: "shampoo" | "conditioner" | "mask" | "oil" | "serum" | "treatment" | "other";
  amount?: "light" | "normal" | "heavy";
  notes?: string;
}) {
  await logEvent({
    v: BRAIN_CONTRACT_VERSION,
    id: uid(),
    type: "product.used",
    ts: Date.now(),
    payload: {
      product: {
        id: params.id,
        name: params.name,
        brand: params.brand,
        tags: params.tags || [],
        source: params.source || "manual",
      },
      step: params.step,
      amount: params.amount,
      notes: params.notes,
    },
  } as any);
}

export async function logBagAdded(params: {
  id: string;
  name?: string;
  tags?: string[];
  source?: "amazon" | "bundle" | "manual";
}) {
  await logEvent({
    v: BRAIN_CONTRACT_VERSION,
    id: uid(),
    type: "bag.added",
    ts: Date.now(),
    payload: {
      product: {
        id: params.id,
        name: params.name,
        tags: params.tags || [],
        source: params.source || "amazon",
      },
    },
  } as any);
}

export async function logPurchaseRecorded(params: {
  source: "amazon" | "manual";
  items: Array<{ id: string; name?: string; qty?: number; tags?: string[] }>;
}) {
  await logEvent({
    v: BRAIN_CONTRACT_VERSION,
    id: uid(),
    type: "purchase.recorded",
    ts: Date.now(),
    payload: {
      order: { source: params.source },
      items: params.items || [],
    },
  } as any);
}

export async function logAppSession(kind: "open" | "close", screen?: string) {
  await logEvent({
    v: BRAIN_CONTRACT_VERSION,
    id: uid(),
    type: "app.session",
    ts: Date.now(),
    payload: { kind, screen },
  } as any);
}
