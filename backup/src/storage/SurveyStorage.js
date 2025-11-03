// simple local storage for personalization + metadata (can swap to backend later)
import AsyncStorage from "@react-native-async-storage/async-storage";

const SURVEY_KEY = "@omnitintai:personalization";
const META_KEY   = "@omnitintai:meta"; // rolling buffer, optional

export async function saveSurveyAnswers(obj) {
  try {
    await AsyncStorage.setItem(SURVEY_KEY, JSON.stringify(obj));
    return true;
  } catch { return false; }
}

export async function loadSurveyAnswers() {
  try {
    const raw = await AsyncStorage.getItem(SURVEY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// optional: store anonymized meta events
export async function pushMetaEvent(event) {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ ...event, ts: Date.now() });
    await AsyncStorage.setItem(META_KEY, JSON.stringify(arr.slice(-500))); // cap buffer
  } catch {}
}
