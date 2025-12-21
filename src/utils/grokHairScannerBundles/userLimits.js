// client/src/utils/grokHairScannerBundles/userLimits.js
// ✅ Correct split: canUseLimit = READ ONLY, consumeLimit = INCREMENT ONLY ON ACTION

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Logger } from "@utils/logger";
import { logAR } from "@utils/metrics";

const FREE_LIMITS = {
  CHAT_MESSAGES: 10,
  AR_TRY_ON: 3,
  AR_360: 2,
  HAIR_SCANNER: 3,
  HAIR_MIXER: 3,
  AI_STYLES: 3,
  TREND_RADAR: 3,
  BUNDLES: 3,
  PROGRESS_TRACKER: 3,
};

const FALLBACK_LIMIT = 3;

function todayKey(featureKey) {
  const today = new Date().toISOString().split("T")[0];
  return `@omni_limit_${featureKey}_${today}`;
}

function limitFor(featureKey) {
  return FREE_LIMITS[featureKey] ?? FALLBACK_LIMIT;
}

/**
 * READ ONLY — does NOT increment
 */
export async function canUseLimit(featureKey, { isPremium = false } = {}) {
  if (isPremium) {
    return { allowed: true, remaining: Infinity, used: 0, limit: Infinity };
  }

  const max = limitFor(featureKey);
  const key = todayKey(featureKey);

  try {
    const raw = await AsyncStorage.getItem(key);
    const used = Number(raw || "0");

    const allowed = used < max;
    return {
      allowed,
      remaining: Math.max(0, max - used),
      used,
      limit: max,
    };
  } catch (e) {
    Logger.error("[userLimits] canUseLimit storage error", e);
    // Fail-open (don't block user)
    return { allowed: true, remaining: max, used: 0, limit: max };
  }
}

/**
 * INCREMENT ONLY — call ONLY when user actually uses the feature
 */
export async function consumeLimit(featureKey, { isPremium = false } = {}) {
  if (isPremium) {
    return { allowed: true, remaining: Infinity, used: 0, limit: Infinity };
  }

  const max = limitFor(featureKey);
  const key = todayKey(featureKey);

  try {
    const raw = await AsyncStorage.getItem(key);
    const used = Number(raw || "0");

    // already at limit — do not increment
    if (used >= max) {
      Logger.warn(`[userLimits] ${featureKey} — LIMIT HIT (${used}/${max})`);
      logAR("limit_hit", { feature: featureKey, used, limit: max });

      return { allowed: false, remaining: 0, used, limit: max };
    }

    // increment
    const next = used + 1;
    await AsyncStorage.setItem(key, String(next));

    Logger.warn(`[userLimits] ${featureKey} — LIMIT USE (${next}/${max})`);
    logAR("limit_use", { feature: featureKey, used: next, limit: max });

    return { allowed: true, remaining: Math.max(0, max - next), used: next, limit: max };
  } catch (e) {
    Logger.error("[userLimits] consumeLimit storage error", e);
    // Fail-open
    return { allowed: true, remaining: max, used: 0, limit: max };
  }
}
