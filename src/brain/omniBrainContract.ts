// client/src/brain/omniBrainContract.ts
// OmniTintAI Brain Contract (V1)
// - Minimal, high-signal, V2-ready
// - No photos, no raw images. Metadata only.

export const BRAIN_CONTRACT_VERSION = 1 as const;

// Keep event types finite + stable (add new types over time)
export type OmniEventType =
  | "personalization.saved"
  | "scan.completed"
  | "product.used"
  | "bag.added"
  | "purchase.recorded"
  | "app.session";

// Common base
export type OmniEventBase<TType extends OmniEventType, TPayload> = {
  v: typeof BRAIN_CONTRACT_VERSION;
  id: string;      // uuid
  type: TType;
  ts: number;      // Date.now()
  payload: TPayload;
  // NOTE: V1: do NOT require userId. If you add later, keep it local-only.
  userId?: string | null;
};

// ─────────────────────────────────────────────────────────────
// Payload shapes (V1 minimal but extensible)
// ─────────────────────────────────────────────────────────────

export type PersonalizationSavedPayload = {
  profile: {
    version: 1;
    primaryGoal: "repair" | "growth" | "color_protection" | "frizz_control" | "shine" | "maintenance" | "volume";
    tonePreference: "warm" | "cool" | "neutral";
    styleVibe: "natural" | "bold" | "experimental";
    texture: "straight" | "wavy" | "curly" | "coily";
    strandThickness: "fine" | "medium" | "thick";
    isColorTreated: boolean;
    routineConsistency: "low" | "medium" | "high";
    frequency?: string;
    updatedAt: number;
  };
};

export type ScanCompletedPayload = {
  scanId: string; // uuid
  // Metadata only (scores/flags/confidence)
  metrics: Record<string, number>; // e.g. { moisture: 72, damage: 18 }
  flags?: string[];                // e.g. ["dryness_risk", "split_ends"]
  confidence?: "low" | "medium" | "high";
  // Optional: deltas if you compute them later
  deltaFromPrev?: Record<string, number>;
  // Optional confirmations used to improve accuracy later
  confirmations?: Record<string, boolean | string | number>;
};

export type ProductUsedPayload = {
  product: {
    id: string;          // asin or internal id
    name?: string;
    brand?: string;
    tags?: string[];     // e.g. ["repair","bond"]
    source?: "amazon" | "bundle" | "manual";
  };
  step?: "shampoo" | "conditioner" | "mask" | "oil" | "serum" | "treatment" | "other";
  amount?: "light" | "normal" | "heavy";
  notes?: string;        // keep short; avoid personal info
};

export type BagAddedPayload = {
  product: {
    id: string; // asin
    name?: string;
    tags?: string[];
    source?: "amazon" | "bundle" | "manual";
  };
};

export type PurchaseRecordedPayload = {
  order: {
    source: "amazon" | "manual";
    // You can store affiliate click IDs later; keep V1 minimal
  };
  items: Array<{
    id: string; // asin
    name?: string;
    qty?: number;
    tags?: string[];
  }>;
};

export type AppSessionPayload = {
  // Useful later for derived retention & “self-aware” context
  kind: "open" | "close";
  screen?: string;
};

// Concrete event union
export type OmniEvent =
  | OmniEventBase<"personalization.saved", PersonalizationSavedPayload>
  | OmniEventBase<"scan.completed", ScanCompletedPayload>
  | OmniEventBase<"product.used", ProductUsedPayload>
  | OmniEventBase<"bag.added", BagAddedPayload>
  | OmniEventBase<"purchase.recorded", PurchaseRecordedPayload>
  | OmniEventBase<"app.session", AppSessionPayload>;
