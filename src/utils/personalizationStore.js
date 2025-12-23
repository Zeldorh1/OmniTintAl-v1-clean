// client/src/utils/personalizationStore.js
// V1 FLAGSHIP — stable profile seed (AsyncStorage) + "just saved" flag for Home animation

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@omnitintai:personalization_v1";
const JUST_SAVED_FLAG = "@omnitintai:personalization_just_saved_v1";

export async function savePersonalization(rawAnswers = {}) {
  const profile = normalizePersonalization(rawAnswers);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  await AsyncStorage.setItem(JUST_SAVED_FLAG, "1");
  return profile;
}

export async function getPersonalization() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("[personalizationStore] get failed:", e);
    return null;
  }
}

export async function clearPersonalization() {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, JUST_SAVED_FLAG]);
  } catch (e) {
    console.warn("[personalizationStore] clear failed:", e);
  }
}

export async function consumeJustSavedFlag() {
  try {
    const value = await AsyncStorage.getItem(JUST_SAVED_FLAG);
    if (value === "1") {
      await AsyncStorage.removeItem(JUST_SAVED_FLAG);
      return true;
    }
    return false;
  } catch (e) {
    console.warn("[personalizationStore] consume flag failed:", e);
    return false;
  }
}

export function normalizePersonalization(a = {}) {
  const toLower = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");
  const pick = (v, fallback) => (v == null || v === "" ? fallback : v);

  const goalText = toLower(a.goal || a.primaryGoal || "");
  const toneText = toLower(a.tone || a.tonePreference || "");
  const hairText = toLower(a.hairType || a.hairTexture || "");
  const freqText = toLower(a.frequency || "");

  const primaryGoal = pick(toLower(a.primaryGoal), guessGoalFromText(goalText) || "repair");
  const tonePreference = pick(toLower(a.tonePreference), guessToneFromText(toneText) || "neutral");
  const styleVibe = pick(toLower(a.styleVibe), guessVibeFromText(toneText) || "natural");
  const texture = pick(toLower(a.texture), guessTextureFromText(hairText) || "wavy");
  const strandThickness = pick(toLower(a.strandThickness), guessThicknessFromText(hairText) || "medium");

  const isColorTreated =
    typeof a.isColorTreated === "boolean"
      ? a.isColorTreated
      : guessColorTreatedFromText(hairText, goalText, freqText);

  const routineConsistency = pick(toLower(a.routineConsistency), "medium");

  return {
    version: 1,
    primaryGoal, // repair | growth | color_protection | frizz_control | shine | maintenance | volume
    tonePreference, // warm | cool | neutral
    styleVibe, // natural | bold | experimental
    texture, // straight | wavy | curly | coily
    strandThickness, // fine | medium | thick
    isColorTreated, // boolean
    routineConsistency, // low | medium | high
    frequency: freqText || "",
    updatedAt: Date.now(),
  };
}

// Guess helpers (strict)
function guessGoalFromText(text) {
  if (!text) return null;
  if (text.includes("grow") || text.includes("length") || text.includes("longer")) return "growth";
  if (text.includes("repair") || text.includes("damage") || text.includes("break")) return "repair";
  if (text.includes("color") || text.includes("fade") || text.includes("dye") || text.includes("longevity")) return "color_protection";
  if (text.includes("frizz") || text.includes("puffy") || text.includes("smooth")) return "frizz_control";
  if (text.includes("shine") || text.includes("gloss")) return "shine";
  if (text.includes("easy") || text.includes("low") || text.includes("maint")) return "maintenance";
  if (text.includes("volume") || text.includes("body") || text.includes("lift")) return "volume";
  return null;
}
function guessToneFromText(text) {
  if (!text) return null;
  if (text.includes("warm") || text.includes("gold") || text.includes("honey") || text.includes("copper")) return "warm";
  if (text.includes("cool") || text.includes("ash") || text.includes("icy") || text.includes("platinum") || text.includes("silver")) return "cool";
  return null;
}
function guessVibeFromText(text) {
  if (!text) return null;
  if (text.includes("bold") || text.includes("vibrant") || text.includes("bright")) return "bold";
  if (text.includes("natural") || text.includes("soft") || text.includes("subtle")) return "natural";
  if (text.includes("fun") || text.includes("fashion") || text.includes("experimental") || text.includes("crazy")) return "experimental";
  return null;
}
function guessTextureFromText(text) {
  if (!text) return null;
  if (text.includes("straight")) return "straight";
  if (text.includes("wavy")) return "wavy";
  if (text.includes("curly")) return "curly";
  if (text.includes("coily") || text.includes("kinky") || text.includes("4c") || text.includes("4b")) return "coily";
  return null;
}
function guessThicknessFromText(text) {
  if (!text) return null;
  if (text.includes("fine") || text.includes("thin")) return "fine";
  if (text.includes("thick") || text.includes("dense")) return "thick";
  if (text.includes("medium")) return "medium";
  return null;
}
function guessColorTreatedFromText(...texts) {
  const combined = texts.join(" ");
  return (
    combined.includes("color") ||
    combined.includes("bleach") ||
    combined.includes("treated") ||
    combined.includes("toner") ||
    combined.includes("dye") ||
    combined.includes("highlight")
  );
}
