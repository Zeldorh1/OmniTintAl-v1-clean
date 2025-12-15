// client/src/utils/grokHairScannerBundles/userLimits.js
// FINAL — daily feature limits (client-side) with telemetry + future hooks

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@utils/logger';
import { logAR } from '@utils/metrics';

// DAILY FREE LIMITS (per feature)
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

/**
 * checkLimit(featureKey, { isPremium })
 * Returns:
 * {
 *    allowed: boolean,
 *    limit: number,
 *    remaining: number,
 *    used: number
 * }
 */
export async function checkLimit(featureKey, { isPremium = false } = {}) {
  // Premium = unlimited
  if (isPremium) {
    return {
      allowed: true,
      remaining: Infinity,
      used: 0,
      limit: Infinity,
    };
  }

  const max = FREE_LIMITS[featureKey] ?? FALLBACK_LIMIT;
  const today = new Date().toISOString().split('T')[0];
  const key = `@omni_limit_${featureKey}_${today}`;

  try {
    const raw = await AsyncStorage.getItem(key);
    const used = Number(raw || '0');

    // If limit exceeded
    if (used >= max) {
      Logger.warn(`[userLimits] ${featureKey} — REACHED LIMIT (${used}/${max})`);

      logAR('limit_hit', {
        feature: featureKey,
        used,
        limit: max,
      });

      return {
        allowed: false,
        remaining: 0,
        used,
        limit: max,
      };
    }

    // Increment & persist
    const next = used + 1;
    await AsyncStorage.setItem(key, String(next));

    // Telemetry
    logAR('limit_use', {
      feature: featureKey,
      used: next,
      limit: max,
    });

    return {
      allowed: true,
      remaining: max - next,
      used: next,
      limit: max,
    };
  } catch (e) {
    Logger.error('[userLimits] storage error', e);

    // Fail-open (never block user on unexpected error)
    return {
      allowed: true,
      remaining: max,
      used: 0,
      limit: max,
    };
  }
}
