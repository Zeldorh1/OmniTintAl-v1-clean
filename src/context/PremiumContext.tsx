// client/src/context/PremiumContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FeatureKey = string;

type PremiumState = {
  isPremium: boolean;

  // Gate expects this name:
  setPremium: (v: boolean) => Promise<void>;

  // Gate expects this name:
  usesLeft: (feature: FeatureKey) => number;

  // Useful for screens:
  consumeUse: (feature: FeatureKey) => Promise<number>;

  // Helper: checks + consumes or navigates to gate
  requireFeature: (nav: any, feature: FeatureKey) => Promise<boolean>;
};

const STORAGE_KEY = '@omnitintai:premium';
const USES_KEY = '@omnitintai:premium_uses';

const DEFAULT_FREE_USES: Record<string, number> = {
  'ai-suggested-styles': 3,
  'ai-chat': 5,
  'hair-scanner': 1,
  'trend-radar': 0,
  'ar-360': 0,
};

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
    (feature: FeatureKey) => {
      if (isPremium) return 999999;
      const current = usesMap[feature];
      if (typeof current === 'number') return current;
      return DEFAULT_FREE_USES[feature] ?? 0;
    },
    [isPremium, usesMap]
  );

  const consumeUse = useCallback(
    async (feature: FeatureKey) => {
      if (isPremium) return 999999;
      const left = usesLeft(feature);
      const next = Math.max(0, left - 1);
      setUsesMap(prev => ({ ...prev, [feature]: next }));
      return next;
    },
    [isPremium, usesLeft]
  );

  const requireFeature = useCallback(
    async (nav: any, feature: FeatureKey) => {
      if (isPremium) return true;

      const left = usesLeft(feature);
      if (left > 0) {
        await consumeUse(feature);
        return true;
      }

      // IMPORTANT: route name must match your navigator (see below)
      nav.navigate('PremiumGate', { feature, usesLeft: left });
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
  if (!ctx) throw new Error('usePremium must be used inside PremiumProvider');
  return ctx;
}
