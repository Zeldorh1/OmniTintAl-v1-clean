// client/src/utils/grokHairScannerBundles/userLimits.js
// V1: daily limits + rewarded ad credits (+1 use)
// canUseLimit = read-only, consumeLimit = increment on action

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

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function usedKey(featureKey) {
  return `@omni_limit_used_${featureKey}_${todayStr()}`;
}

function creditKey(featureKey) {
  return `@omni_limit_credit_${featureKey}_${todayStr()}`;
}

function limitFor(featureKey) {
  return FREE_LIMITS[featureKey] ?? FALLBACK_LIMIT;
}

// ✅ Call this after a rewarded ad completes successfully
export async function grantAdCredit(featureKey, count = 1) {
  const key = creditKey(featureKey);
  try {
    const raw = await AsyncStorage.getItem(key);
    const credits = Number(raw || "0");
    const next = credits + Math.max(1, Number(count || 1));
    await AsyncStorage.setItem(key, String(next));
    Logger.warn(`[userLimits] ${featureKey} — AD CREDIT +${count} (total ${next})`);
    return next;
  } catch (e) {
    Logger.error("[userLimits] grantAdCredit storage error", e);
    return 0;
  }
}

/**
 * READ ONLY — does NOT increment
 */
export async function canUseLimit(featureKey, { isPremium = false } = {}) {
  if (isPremium) return { allowed: true, remaining: Infinity, used: 0, limit: Infinity };

  const max = limitFor(featureKey);
  try {
    const usedRaw = await AsyncStorage.getItem(usedKey(featureKey));
    const creditRaw = await AsyncStorage.getItem(creditKey(featureKey));

    const used = Number(usedRaw || "0");
    const credits = Number(creditRaw || "0");

    const effectiveLimit = max + credits;
    const allowed = used < effectiveLimit;

    return {
      allowed,
      remaining: Math.max(0, effectiveLimit - used),
      used,
      limit: effectiveLimit,
      baseLimit: max,
      credits,
    };
  } catch (e) {
    Logger.error("[userLimits] canUseLimit storage error", e);
    return { allowed: true, remaining: max, used: 0, limit: max, baseLimit: max, credits: 0 };
  }
}

/**
 * INCREMENT ONLY — call ONLY when user actually uses the feature
 */
export async function consumeLimit(featureKey, { isPremium = false } = {}) {
  if (isPremium) return { allowed: true, remaining: Infinity, used: 0, limit: Infinity };

  const max = limitFor(featureKey);

  try {
    const usedRaw = await AsyncStorage.getItem(usedKey(featureKey));
    const creditRaw = await AsyncStorage.getItem(creditKey(featureKey));
    const used = Number(usedRaw || "0");
    const credits = Number(creditRaw || "0");

    const effectiveLimit = max + credits;

    if (used >= effectiveLimit) {
      Logger.warn(`[userLimits] ${featureKey} — LIMIT HIT (${used}/${effectiveLimit})`);
      logAR("limit_hit", { feature: featureKey, used, limit: effectiveLimit });
      return { allowed: false, remaining: 0, used, limit: effectiveLimit, baseLimit: max, credits };
    }

    const next = used + 1;
    await AsyncStorage.setItem(usedKey(featureKey), String(next));

    Logger.warn(`[userLimits] ${featureKey} — LIMIT USE (${next}/${effectiveLimit})`);
    logAR("limit_use", { feature: featureKey, used: next, limit: effectiveLimit });

    return {
      allowed: true,
      remaining: Math.max(0, effectiveLimit - next),
      used: next,
      limit: effectiveLimit,
      baseLimit: max,
      credits,
    };
  } catch (e) {
    Logger.error("[userLimits] consumeLimit storage error", e);
    return { allowed: true, remaining: max, used: 0, limit: max, baseLimit: max, credits: 0 };
  }
}
