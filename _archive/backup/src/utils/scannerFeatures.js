// client/src/utils/scannerFeatures.js
// Build a stable, normalized feature vector for hair scans.
// DO NOT change length without bumping FV_VERSION.
export const FV_VERSION = 'hair_v1';

// Clamp helper
const c01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

// One-hot encoders
const ONE = (opts, key) => opts.map(v => (v === key ? 1 : 0));

/**
 * scan: numbers (0..1 preferred, but we’ll clamp)
 *   dryness, splitEnds, scalpOil, frizz, shine, colorDamage, breakage
 *   hairLength: 'pixie'|'bob'|'shoulder'|'long'
 *   hairTexture: 'straight'|'wavy'|'curly'|'coily'
 *   dyedRecentlyDays: number (days)
 * env: optional capture conditions
 *   lux: ambient brightness (0..1)
 *   expoBias: exposure compensation-ish (-1..+1 -> map to 0..1)
 *   blur: 0..1 estimate
 * user: optional survey/profile
 *   washPerWeek (0..14 normalize to 0..1)
 *   heatStylePerWeek (0..14)
 *   chemicalTreatFreq (0..1 already)
 */
export function buildScannerVector(scan={}, env={}, user={}) {
  // hair condition (7 dims)
  const cond = [
    c01(scan.dryness),
    c01(scan.splitEnds),
    c01(scan.scalpOil),
    c01(scan.frizz),
    c01(scan.shine),
    c01(scan.colorDamage),
    c01(scan.breakage),
  ];

  // length (4), texture (4)
  const lenBits = ONE(['pixie','bob','shoulder','long'], scan.hairLength);
  const texBits = ONE(['straight','wavy','curly','coily'], scan.hairTexture);

  // recency of dye (0 days -> 1, 180+ days -> ~0)
  const dyeRecency = (() => {
    const d = Math.max(0, Number(scan.dyedRecentlyDays) || 0);
    return c01(1 - Math.min(180, d)/180);
  })();

  // environment (3): brightness, exposure mapped, blur
  const envV = [
    c01(env.lux),
    c01((Number(env.expoBias) || 0) * 0.5 + 0.5), // -1..+1 -> 0..1
    c01(env.blur),
  ];

  // user habits (3)
  const habits = [
    c01((Number(user.washPerWeek) || 0) / 14),
    c01((Number(user.heatStylePerWeek) || 0) / 14),
    c01(user.chemicalTreatFreq),
  ];

  const x = [
    ...cond,           // 7
    ...lenBits,        // +4 = 11
    ...texBits,        // +4 = 15
    dyeRecency,        // +1 = 16
    ...envV,           // +3 = 19
    ...habits,         // +3 = 22
  ];
  return { x, fv_version: FV_VERSION };
}
