// client/src/utils/grokHairScannerBundles/userBlacklist.js
// Keeps a per-device blacklist of ASINs / product IDs the user never wants to see again.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@/utils/logger';

const KEY = '@omni_blacklist_v1';
const MAX_ITEMS = 500; // safety cap so it never grows unbounded

function normalizeId(id) {
  if (!id) return null;
  return String(id).trim();
}

function safeParseList(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // de-dupe + normalize
    const set = new Set(
      parsed
        .map(normalizeId)
        .filter(Boolean)
    );
    return Array.from(set);
  } catch {
    return [];
  }
}

async function loadList() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const list = safeParseList(raw);
    return list;
  } catch (e) {
    Logger.warn('[userBlacklist] load error', e);
    return [];
  }
}

async function saveList(list) {
  try {
    const normalized = Array.from(
      new Set(list.map(normalizeId).filter(Boolean))
    ).slice(-MAX_ITEMS); // keep most recent entries
    await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
    return normalized;
  } catch (e) {
    Logger.warn('[userBlacklist] save error', e);
    return list;
  }
}

/**
 * Add an ASIN (or product ID) to the blacklist.
 */
export async function addToBlacklist(id) {
  const norm = normalizeId(id);
  if (!norm) return await loadList();

  const list = await loadList();
  if (!list.includes(norm)) {
    list.push(norm);
    const saved = await saveList(list);
    Logger.info('[userBlacklist] added', norm);
    return saved;
  }
  return list;
}

/**
 * Remove an ASIN from the blacklist.
 */
export async function removeFromBlacklist(id) {
  const norm = normalizeId(id);
  if (!norm) return await loadList();

  const list = await loadList();
  const next = list.filter((x) => x !== norm);
  const saved = await saveList(next);
  Logger.info('[userBlacklist] removed', norm);
  return saved;
}

/**
 * Get full blacklist array.
 */
export async function getBlacklist() {
  return await loadList();
}
