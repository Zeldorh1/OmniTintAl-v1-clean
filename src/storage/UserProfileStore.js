// client/src/storage/storage.js
// FLAGSHIP STORAGE LAYER FOR OMNITINTAI
// Local-only (safe). Can be swapped for backend sync later.

import AsyncStorage from "@react-native-async-storage/async-storage";

const SURVEY_KEY = "@omni:survey";
const META_KEY   = "@omni:meta"; // rolling event log (local analytics)
const META_LIMIT = 500;          // keep last 500 events

// -------------------------------
// Personalization Survey
// -------------------------------
export async function saveSurveyAnswers(obj) {
  try {
    await AsyncStorage.setItem(SURVEY_KEY, JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
}

export async function loadSurveyAnswers() {
  try {
    const raw = await AsyncStorage.getItem(SURVEY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// -------------------------------
// Metadata / Telemetry Logging
// -------------------------------
export async function logEvent(type, payload = {}) {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    const evt = {
      type,                // e.g., "AR_USED", "SCAN_DONE", "PRODUCT_VIEWED"
      payload,             // dynamic details
      ts: Date.now(),      // timestamp
      v: 1,                // schema version (important for upgrades later)
    };

    arr.push(evt);

    // Cap to last META_LIMIT events
    const clipped = arr.slice(-META_LIMIT);
    await AsyncStorage.setItem(META_KEY, JSON.stringify(clipped));
  } catch (e) {
    console.warn("logEvent failed", e);
  }
}

export async function getMetaEvents(limit = 100) {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return arr.slice(-limit);
  } catch {
    return [];
  }
}

export async function clearMeta() {
  try {
    await AsyncStorage.removeItem(META_KEY);
  } catch {}
}
