// client/src/utils/styleFeatures.js
import { toUserFeatureVector } from '../components/FaceMeshWorker';

// map enums into one-hot bits
const LEN = ['pixie','bob','shoulder','long'];
const TEX = ['straight','wavy','curly','coily'];
const TONE = ['warm','cool','neutral'];

export function featurize(userFeats, styleFeats, faceMeta=null) {
  // face-derived core vector (7 dims) or zeros if not available
  const faceV = faceMeta?.meta && faceMeta?.derived
    ? toUserFeatureVector({ meta: faceMeta.meta, derived: faceMeta.derived })
    : [0,0,0,0,0,0,0];

  // user priors (keep small for now)
  const u = [
    clamp01(userFeats?.hairThickness ?? 0.5),
    clamp01(userFeats?.skintone?.warm ?? 0.33),
    clamp01(userFeats?.skintone?.cool ?? 0.33),
    clamp01(userFeats?.skintone?.neutral ?? 0.34),
    clamp01(userFeats?.faceRatios?.jawToCheek ?? 0.5),
    clamp01(userFeats?.faceRatios?.cheekToForehead ?? 0.5),
  ];

  // style one-hots
  const lengthBits = oneHot(LEN, styleFeats.length);
  const texBits    = oneHot(TEX, styleFeats.texture);
  const toneBits   = oneHot(TONE, styleFeats.colorTone);
  const numeric    = [
    clamp01(styleFeats.bangs ? 1 : 0),
    clamp01(styleFeats.layers ? 1 : 0),
    clamp01(styleFeats.volume ?? 0.5),
  ];

  return [...faceV, ...u, ...lengthBits, ...texBits, ...toneBits, ...numeric];
}

function oneHot(arr, key){ return arr.map(v => (v===key?1:0)); }
function clamp01(x){ return Math.max(0, Math.min(1, Number(x)||0)); }
