// =============================
// File: client/src/utils/ColorBlendEngine.js
// =============================

export function rgbToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(
    Math.max(0, Math.min(255, Math.round(g)))
  )}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}

// ---- Color space conversions ----
function rgbToXyz(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  r = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return { x, y, z };
}

function xyzToLab(x, y, z) {
  const refX = 0.95047,
    refY = 1.0,
    refZ = 1.08883;
  x /= refX;
  y /= refY;
  z /= refZ;

  const f = (t) =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  const fx = f(x),
    fy = f(y),
    fz = f(z);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return { L, a, b };
}

function labToXyz(L, a, b) {
  const refX = 0.95047,
    refY = 1.0,
    refZ = 1.08883;
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const fInv = (t) =>
    t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
  const x = refX * fInv(fx);
  const y = refY * fInv(fy);
  const z = refZ * fInv(fz);
  return { x, y, z };
}

function xyzToRgb(x, y, z) {
  let r = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  let g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  let b = 0.0557 * x - 0.204 * y + 1.057 * z;
  const comp = (c) =>
    c <= 0.0031308
      ? 12.92 * c
      : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  r = comp(r);
  g = comp(g);
  b = comp(b);
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ---- LAB-space mixing ----
export function mixColorsLAB(hexes, ratios) {
  if (!hexes.length) return "#000000";
  if (hexes.length === 1) return hexes[0];
  const w =
    ratios && ratios.length === hexes.length
      ? ratios
      : Array(hexes.length).fill(1);
  const sum = w.reduce((a, b) => a + b, 0);
  const W = w.map((v) => v / (sum || 1));

  let L = 0,
    A = 0,
    B = 0;
  hexes.forEach((h, i) => {
    const { r, g, b } = hexToRgb(h);
    const { x, y, z } = rgbToXyz(r, g, b);
    const lab = xyzToLab(x, y, z);
    L += lab.L * W[i];
    A += lab.a * W[i];
    B += lab.b * W[i];
  });

  const { x, y, z } = labToXyz(L, A, B);
  const { r, g, b } = xyzToRgb(x, y, z);
  return rgbToHex(r, g, b);
}

// ---- ΔE distance + closest match ----
export function deltaE(lab1, lab2) {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function closestMatch(targetHex, candidates) {
  const t = hexToRgb(targetHex);
  const { x: tx, y: ty, z: tz } = rgbToXyz(t.r, t.g, t.b);
  const tlab = xyzToLab(tx, ty, tz);
  let best = null;
  for (const c of candidates) {
    const { r, g, b } = hexToRgb(c.hex);
    const { x, y, z } = rgbToXyz(r, g, b);
    const lab = xyzToLab(x, y, z);
    const d = deltaE(tlab, lab);
    if (!best || d < best.distance) best = { ...c, distance: d };
  }
  return best;
}
