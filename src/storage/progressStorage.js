// src/utils/progressStorage.js
export function toInches(value) {
  if (value == null || isNaN(Number(value))) return 0;
  return Number(value);
}

export function recommendRecordWeeks(entries) {
  if (!Array.isArray(entries)) return [];
  const weeks = entries
    .map((e) => (e && typeof e.week === "number" ? e.week : null))
    .filter((w) => w != null);
  return Array.from(new Set(weeks)).sort((a, b) => a - b);
}
