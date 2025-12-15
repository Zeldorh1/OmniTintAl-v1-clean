// Very small library for demo; swap with your real assets/URLs later
export const STYLE_LIBRARY = [
  { id: 'lob_soft',    name: 'Soft Long Bob',    thumb: 'https://picsum.photos/seed/lob/400/300' },
  { id: 'pixie_text',  name: 'Textured Pixie',   thumb: 'https://picsum.photos/seed/pixie/400/300' },
  { id: 'long_layers', name: 'Long Layers',      thumb: 'https://picsum.photos/seed/layers/400/300' },
  { id: 'wave_mid',    name: 'Mid Waves',        thumb: 'https://picsum.photos/seed/waves/400/300' },
  { id: 'bob_chin',    name: 'Chin Bob',         thumb: 'https://picsum.photos/seed/chin/400/300' },
  { id: 'curtain',     name: 'Curtain Fringe',   thumb: 'https://picsum.photos/seed/curtain/400/300' },
  { id: 'side_part',   name: 'Side Part',        thumb: 'https://picsum.photos/seed/side/400/300' },
  { id: 'shag',        name: 'Modern Shag',      thumb: 'https://picsum.photos/seed/shag/400/300' },
];

// Simple geometry helpers from 468 FaceMesh points
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function inferFaceShape(points) {
  if (!points || points.length < 468) return 'Unknown';

  // indices (approx): chin 152, forehead 10, temples 234/454, jaw corners 58/288, cheeks 127/356
  const chin = points[152], forehead = points[10];
  const leftTemple = points[234], rightTemple = points[454];
  const leftJaw = points[58], rightJaw = points[288];
  const leftCheek = points[127], rightCheek = points[356];

  const faceLen = dist(chin, forehead);
  const templeW = dist(leftTemple, rightTemple);
  const jawW = dist(leftJaw, rightJaw);
  const cheekW = dist(leftCheek, rightCheek);

  // crude ratios
  const lenToWidth = faceLen / Math.max(templeW, cheekW);
  const foreheadVsJaw = templeW / jawW;

  if (lenToWidth > 1.45 && Math.abs(foreheadVsJaw - 1) < 0.1) return 'Oval';
  if (lenToWidth < 1.25 && Math.abs(foreheadVsJaw - 1) < 0.15) return 'Round';
  if (Math.abs(foreheadVsJaw - 1) < 0.06 && lenToWidth >= 1.25 && lenToWidth <= 1.45) return 'Square';
  if (foreheadVsJaw > 1.12) return 'Heart';
  if (foreheadVsJaw < 0.9) return 'Diamond';
  return 'Oval';
}

export function rankStyles(faceShape, hairHealth /* optional */) {
  // weights by face shape
  const weights = {
    Oval:     { long_layers: 95, wave_mid: 90, shag: 88, side_part: 85, lob_soft: 83, pixie_text: 80, bob_chin: 78, curtain: 82 },
    Round:    { long_layers: 92, side_part: 90, wave_mid: 86, shag: 84, curtain: 82, lob_soft: 80, pixie_text: 74, bob_chin: 72 },
    Square:   { wave_mid: 92, lob_soft: 90, long_layers: 86, shag: 84, curtain: 82, side_part: 80, pixie_text: 76, bob_chin: 74 },
    Heart:    { bob_chin: 92, lob_soft: 90, wave_mid: 86, curtain: 84, shag: 82, long_layers: 80, side_part: 78, pixie_text: 76 },
    Diamond:  { curtain: 92, wave_mid: 90, lob_soft: 86, long_layers: 84, shag: 82, bob_chin: 80, side_part: 78, pixie_text: 74 },
    Unknown:  { long_layers: 85, wave_mid: 84, lob_soft: 83, shag: 82, curtain: 81, side_part: 80, bob_chin: 79, pixie_text: 78 },
  };

  const table = weights[faceShape] || weights.Unknown;
  const scored = STYLE_LIBRARY.map((s) => ({
    ...s,
    score: (table[s.id] || 70),
  }));

  // potential future tweak with hairHealth (breakage, dryness, density, curl, etc.)
  // e.g., if hairHealth?.breakageHigh => penalize long_layers a bit, etc.

  return scored.sort((a, b) => b.score - a.score);
}
