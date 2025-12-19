// client/src/context/PremiumContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FeatureKey =
  | "ai-suggested-styles"
  | "ai-chat"
  | "hair-scanner"
  | "trend-radar"
  | "ar-360";

type PremiumState = {
  isPremium: boolean;
  setPremium: (v: boolean) => Promise<void>;
  usesLeft: (feature: FeatureKey | string) => number;
  consumeUse: (feature: FeatureKey | string) => Promise<number>;
  requireFeature: (nav: any, feature: FeatureKey | string) => Promise<boolean>;
};

const STORAGE_KEY = "@omnitintai:premium";
const USES_KEY = "@omnitintai:premium_uses";

const DEFAULT_FREE_USES: Record<FeatureKey, number> = {
  "ai-suggested-styles": 3,
  "ai-chat": 5,
  "hair-scanner": 1, // ✅ should NOT gate immediately
  "trend-radar": 0,
  "ar-360": 0,
};

// ✅ KEY NORMALIZER: accepts kebab/snake/camel + common aliases
function normalizeFeatureKey(raw: string): FeatureKey {
  const k = (raw || "").trim();

  const lower = k.toLowerCase();

  // common aliases you likely used in screens
  if (lower === "hair_scanner" || lower === "hairscanner" || lower === "hairhealthscanner") return "hair-scanner";
  if (lower === "aichat" || lower === "ai_chat" || lower === "chat") return "ai-chat";
  if (lower === "aistyles" || lower === "ai_styles" || lower === "suggestedstyles") return "ai-suggested-styles";
  if (lower === "trendradar" || lower === "trend_radar") return "trend-radar";
  if (lower === "ar360" || lower === "ar_360" || lower === "360" || lower === "360preview") return "ar-360";

  // normalize snake/camel -> kebab-ish fallback
  const kebab = lower
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  // final mapping
  switch (kebab) {
    case "ai-suggested-styles":
      return "ai-suggested-styles";
    case "ai-chat":
      return "ai-chat";
    case "hair-scanner":
      return "hair-scanner";
    case "trend-radar":
      return "trend-radar";
    case "ar-360":
      return "ar-360";
    default:
      // if something new comes in, treat as premium-only (0)
      return "trend-radar";
  }
}

const PremiumContext = createContext<PremiumState | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [usesMap, setUsesMap] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setIsPremium(!!JSON.parse(raw)?.isPremium);
      } catch {}

      try {
        const rawUses = await AsyncStorage.getItem(USES_KEY);
        if (rawUses) setUsesMap(JSON.parse(rawUses));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isPremium })).catch(() => {});
  }, [isPremium]);

  useEffect(() => {
    AsyncStorage.setItem(USES_KEY, JSON.stringify(usesMap)).catch(() => {});
  }, [usesMap]);

  const setPremium = useCallback(async (v: boolean) => {
    setIsPremium(v);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isPremium: v })).catch(() => {});
  }, []);

  const usesLeft = useCallback(
    (featureRaw: FeatureKey | string) => {
      if (isPremium) return 999999;

      const feature = normalizeFeatureKey(String(featureRaw));

      const current = usesMap[feature];
      if (typeof current === "number") return current;

      return DEFAULT_FREE_USES[feature] ?? 0;
    },
    [isPremium, usesMap]
  );

  const consumeUse = useCallback(
    async (featureRaw: FeatureKey | string) => {
      if (isPremium) return 999999;

      const feature = normalizeFeatureKey(String(featureRaw));
      const left = usesLeft(feature);
      const next = Math.max(0, left - 1);

      setUsesMap((prev) => ({ ...prev, [feature]: next }));
      return next;
    },
    [isPremium, usesLeft]
  );

  const requireFeature = useCallback(
    async (nav: any, featureRaw: FeatureKey | string) => {
      if (isPremium) return true;

      const feature = normalizeFeatureKey(String(featureRaw));
      const left = usesLeft(feature);

      if (left > 0) {
        await consumeUse(feature);
        return true;
      }

      nav.navigate("PremiumGate", { feature, usesLeft: left });
      return false;
    },
    [consumeUse, isPremium, usesLeft]
  );

  const value = useMemo(
    () => ({ isPremium, setPremium, usesLeft, consumeUse, requireFeature }),
    [isPremium, setPremium, usesLeft, consumeUse, requireFeature]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
