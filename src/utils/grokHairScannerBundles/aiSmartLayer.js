// client/src/utils/grokHairScannerBundles/aiSmartLayer.js
// FINAL — 100% CLEAN, NO bundleCurator, READY FOR GROK + MEMORY PIPELINE

import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildOmniContext } from '@/utils/buildOmniContext';
import { askGrokStylist } from './grokStylist';   // future integration

const PREF_KEY = '@omni_ai_prefs_v1';

/* -------------------------------------------------------
 * Load / Save Preferences
 * -----------------------------------------------------*/

async function loadPrefs() {
  try {
    const raw = await AsyncStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.log('[aiSmartLayer] loadPrefs error', e);
    return {};
  }
}

export async function rememberPreferences(partialPrefs = {}) {
  const current = await loadPrefs();
  const next = { ...current, ...partialPrefs };

  try {
    await AsyncStorage.setItem(PREF_KEY, JSON.stringify(next));
  } catch (e) {
    console.log('[aiSmartLayer] rememberPreferences error', e);
  }

  return next;
}

export async function resetAIPreferences() {
  try {
    await AsyncStorage.removeItem(PREF_KEY);
  } catch (e) {
    console.log('[aiSmartLayer] resetAIPreferences error', e);
  }
}

/* -------------------------------------------------------
 * getSmartBundles
 *  - THIS REPLACES curateBundle
 *  - returns a consistent structure:
 *      [{ title, items: [...], reasoning }]
 * -----------------------------------------------------*/

export async function getSmartBundles(options = {}) {
  const { omniContext, look, health, progress, cart, userId } = options;

  const prefs = await loadPrefs();
  const ctx = omniContext || buildOmniContext({ look, health, progress, cart });

  // 🔥 PHASE 2: Real Grok pipeline
  // const grokResp = await askGrokStylist({ ctx, prefs, userId });

  // 🔥 PHASE 1: Temporary placeholder until Grok integration finishes
  const mock = {
    title: "Smart Recommended Set",
    reasoning: "Based on your scan + behavior patterns.",
    items: [
      {
        asin: "MOCK-ASIN-1",
        title: "Hydrating Repair Shampoo",
        price: 19.99,
        image: "https://via.placeholder.com/200",
      },
      {
        asin: "MOCK-ASIN-2",
        title: "Bond-Building Conditioner",
        price: 22.99,
        image: "https://via.placeholder.com/200",
      }
    ]
  };

  return [mock];
}

/* -------------------------------------------------------
 * aiRefineBundles
 *  User says things like:
 *   - "show cheaper"
 *   - "less oily"
 *   - "vegan only"
 * -----------------------------------------------------*/

export async function aiRefineBundles(options = {}) {
  const {
    omniContext,
    look,
    health,
    progress,
    cart,
    userId,
    feedback = {},
  } = options;

  const updatedPrefs = await rememberPreferences(feedback);
  const bundles = await getSmartBundles({
    omniContext,
    look,
    health,
    progress,
    cart,
    userId,
  });

  return { bundles, prefs: updatedPrefs };
}
