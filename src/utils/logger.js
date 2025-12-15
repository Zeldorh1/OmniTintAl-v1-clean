// client/src/utils/Logger.js
// FLAGSHIP DIAGNOSTIC LOGGER FOR OMNITINTAI
// ---------------------------------------------------------
// - Buffers last 500 logs
// - Tags logs with screen, device, build version
// - SafeScreen can auto-send these
// - Future backend endpoint ready: /api/diagnostics
// ---------------------------------------------------------

import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOG_KEY = "@omni:logs";
const MAX_LOGS = 500;

const _buffer = [];

async function persist() {
  try {
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(_buffer.slice(-MAX_LOGS)));
  } catch (e) {
    console.warn("Logger persist failed", e);
  }
}

export const Logger = {
  info: (msg, extra = {}) => {
    const entry = makeEntry("INFO", msg, extra);
    push(entry);
    if (__DEV__) console.log("[INFO]", msg, extra);
  },

  warn: (msg, extra = {}) => {
    const entry = makeEntry("WARN", msg, extra);
    push(entry);
    console.warn("[WARN]", msg, extra);
  },

  error: (msg, extra = {}) => {
    const entry = makeEntry("ERROR", msg, extra);
    push(entry);
    console.error("[ERROR]", msg, extra);
  },

  getBuffer: () => _buffer.slice(-MAX_LOGS),

  async restore() {
    try {
      const raw = await AsyncStorage.getItem(LOG_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        _buffer.push(...arr);
      }
    } catch {}
  },

  async clear() {
    _buffer.length = 0;
    try {
      await AsyncStorage.removeItem(LOG_KEY);
    } catch {}
  },

  // 🚀 Send logs to backend (Cloudflare Worker)
  async send() {
    try {
      const payload = {
        device: await getDeviceInfo(),
        logs: _buffer.slice(-MAX_LOGS),
      };

      // TODO: When ready, replace URL below with your diagnostics worker endpoint:
      // await fetch("https://yourdomain.com/api/diagnostics", { method: "POST", body: JSON.stringify(payload) });

      return { sent: payload.logs.length, ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
};

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function push(entry) {
  _buffer.push(entry);
  if (_buffer.length > MAX_LOGS) _buffer.shift();
  persist();
}

function makeEntry(level, message, extra = {}) {
  return {
    ts: Date.now(),
    level,
    message,
    extra,
    screen: extra?.screen || null,
    error: extra?.error || null,
    build: Constants.expoConfig?.version || "unknown",
  };
}

async function getDeviceInfo() {
  return {
    brand: Device.brand,
    model: Device.modelName,
    os: Device.osName,
    osVersion: Device.osVersion,
    appVersion: Constants.expoConfig?.version || "unknown",
    buildNumber: Constants.expoConfig?.runtimeVersion || "unknown",
  };
}
