// src/utils/progressStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'omni_progress_entries_v1';
// An entry: { id, dateISO, method: 'manual'|'photo', length, unit: 'in'|'cm', photoUri? }

export async function loadEntries() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    // sorted newest first
    return arr.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
  } catch {
    return [];
  }
}

export async function saveEntries(list) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addEntry(entry) {
  const curr = await loadEntries();
  const next = [{ ...entry, id: entry.id ?? String(Date.now()) }, ...curr];
  await saveEntries(next);
  return next;
}

export async function removeEntry(id) {
  const curr = await loadEntries();
  const next = curr.filter((e) => e.id !== id);
  await saveEntries(next);
  return next;
}

export function toInches(value, unit) {
  return unit === 'cm' ? value / 2.54 : value;
}
export function toCm(value, unit) {
  return unit === 'in' ? value * 2.54 : value;
}

// returns inches per month (float)
export function growthPerMonth(entries) {
  // need at least 2 entries with length
  const data = entries
    .filter((e) => typeof e.length === 'number' && !isNaN(e.length))
    .map((e) => ({ ...e, t: new Date(e.dateISO).getTime() }))
    .sort((a, b) => a.t - b.t); // oldest -> newest

  if (data.length < 2) return null;

  const oldest = data[0];
  const newest = data[data.length - 1];

  const deltaIn = toInches(newest.length, newest.unit) - toInches(oldest.length, oldest.unit);
  const days = (newest.t - oldest.t) / (1000 * 60 * 60 * 24);
  if (days <= 0) return null;

  const perMonth = (deltaIn / days) * 30.437; // average month length
  return perMonth;
}

// heuristic: typical recolor every 6–8 weeks; tighten by faster growth
export function recommendRecolorWeeks(inchesPerMonth) {
  if (!inchesPerMonth || inchesPerMonth <= 0) return 8;
  if (inchesPerMonth >= 0.7) return 5.5;
  if (inchesPerMonth >= 0.6) return 6;
  if (inchesPerMonth >= 0.5) return 6.5;
  return 7.5;
}
