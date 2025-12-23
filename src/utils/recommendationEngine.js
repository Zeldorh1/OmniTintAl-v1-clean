// client/src/utils/recommendationEngine.js
// V1 FLAGSHIP — deterministic, fast, explainable recommendation scoring
// - Uses full personalization profile (goal/tone/vibe/texture/thickness/color-treated/routine)
// - Stable tie-breaker
// - Graceful fallback for sparse product data
// - V2-ready: easy to add behavioral + event signals

const contains = (hay, needle) =>
  (hay || "").toLowerCase().includes((needle || "").toLowerCase());

/**
 * @param {{ products: any[], prefs?: any, limit?: number }} params
 */
export function getRecommendedProducts({ products, prefs, limit = 12 }) {
  if (!Array.isArray(products) || products.length === 0) return [];
  if (!prefs) return products.slice(0, limit);

  const scored = products.map((item, originalIndex) => {
    const meta = normalizeProductMeta(item);
    const score = calculateTotalScore(prefs, meta, item, originalIndex);
    return { item, score, originalIndex };
  });

  scored.sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);

  return scored.slice(0, limit).map((x) => x.item);
}

function normalizeProductMeta(item) {
  const tags = Array.isArray(item.tags)
    ? item.tags.map((t) => String(t).toLowerCase().trim())
    : [];

  const name = String(item.name || item.title || "").toLowerCase().trim();
  const desc = String(item.description || item.desc || "")
    .toLowerCase()
    .trim();

  // include name into desc to make sparse data still match
  const full = `${name} ${desc}`.trim();

  return { tags, name, desc: full };
}

function calculateTotalScore(prefs, meta, item, originalIndex) {
  let score = 0;

  // Primary signals (strongest)
  score += scoreGoal(prefs.primaryGoal, meta);
  score += scoreHairFit(prefs, meta);

  // Secondary signals
  score += scoreTone(prefs.tonePreference, meta);
  score += scoreVibe(prefs.styleVibe, meta);
  score += scoreRoutineConsistency(prefs.routineConsistency, meta);

  // Quality bias
  if (itemHasImage(item)) score += 2;
  if (meta.name.length > 0) score += 1;

  // Stability bias (small)
  score += 1 / (originalIndex + 10);

  return score;
}

// ─────────────────────────────────────────────────────────────
// Domain scoring
// ─────────────────────────────────────────────────────────────

function scoreGoal(goal, { tags, desc }) {
  if (!goal) return 0;
  let s = 0;

  switch (goal) {
    case "repair":
      s += match(tags, desc, ["repair", "bond", "strength"], 8, 5);
      s += match(tags, desc, ["protein"], 4, 2);
      s += match(tags, desc, ["moisture", "hydration"], 2, 1);
      break;

    case "growth":
      s += match(tags, desc, ["growth", "length", "longer"], 8, 5);
      s += match(tags, desc, ["scalp", "follicle", "stimulate"], 5, 3);
      s += match(tags, desc, ["breakage", "strength"], 3, 2);
      break;

    case "color_protection":
      s += match(tags, desc, ["color-safe", "color safe", "color", "dye-safe"], 9, 5);
      s += match(tags, desc, ["toner", "gloss", "vibrancy"], 4, 2);
      break;

    case "frizz_control":
      s += match(tags, desc, ["anti-frizz", "frizz", "smooth"], 9, 5);
      s += match(tags, desc, ["humidity", "anti-humidity"], 4, 2);
      break;

    case "shine":
      s += match(tags, desc, ["shine", "gloss", "polish"], 9, 5);
      s += match(tags, desc, ["oil", "serum"], 4, 2);
      break;

    case "maintenance":
      s += match(tags, desc, ["low-maintenance", "easy", "quick"], 9, 5);
      s += match(tags, desc, ["multi-use", "all-in-one"], 4, 2);
      break;

    case "volume":
      s += match(tags, desc, ["volume", "body", "lift"], 9, 5);
      s += match(tags, desc, ["lightweight", "volumizing"], 4, 2);
      break;

    default:
      break;
  }

  return s;
}

function scoreTone(tone, { tags, desc }) {
  if (!tone || tone === "neutral") return 0;
  if (!isColorProduct(tags, desc)) return 0;

  if (tone === "warm") return match(tags, desc, ["warm", "golden", "honey", "copper"], 7, 4);
  if (tone === "cool") return match(tags, desc, ["cool", "ash", "icy", "platinum", "silver"], 7, 4);
  return 0;
}

function scoreVibe(vibe, { tags, desc }) {
  if (!vibe) return 0;
  if (vibe === "natural") return match(tags, desc, ["natural", "soft", "subtle"], 5, 2);
  if (vibe === "bold") return match(tags, desc, ["bold", "vibrant", "intense"], 5, 2);
  if (vibe === "experimental") return match(tags, desc, ["fashion", "experimental", "fun", "creative"], 5, 2);
  return 0;
}

function scoreHairFit(prefs, { tags, desc }) {
  let s = 0;

  // Texture match
  if (prefs.texture === "curly" || prefs.texture === "coily") {
    s += match(tags, desc, ["moisture", "hydration", "curl", "coil"], 6, 3);
    s += match(tags, desc, ["sulfate-free", "sulfate free"], 3, 2);
  } else if (prefs.texture === "straight") {
    s += match(tags, desc, ["volume", "lightweight"], 4, 2);
  }

  // Thickness match
  if (prefs.strandThickness === "fine") {
    s += match(tags, desc, ["lightweight", "non-greasy", "non greasy"], 5, 3);
    s -= match(tags, desc, ["heavy", "rich"], 2, 1);
  } else if (prefs.strandThickness === "thick") {
    s += match(tags, desc, ["deep", "rich", "intense"], 4, 2);
  }

  // Color-treated fit
  if (prefs.isColorTreated) {
    s += match(tags, desc, ["color-safe", "color safe", "sulfate-free", "sulfate free"], 6, 3);
    s -= match(tags, desc, ["clarifying", "stripping"], 4, 2);
  }

  return s;
}

function scoreRoutineConsistency(consistency, { tags, desc }) {
  if (!consistency) return 0;

  if (consistency === "low") {
    return match(tags, desc, ["easy", "quick", "multi-use", "all-in-one"], 7, 4);
  }
  if (consistency === "high") {
    return match(tags, desc, ["routine", "step", "intensive", "treatment"], 4, 2);
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

function match(tags, desc, keywords, tagWeight = 0, textWeight = 0) {
  let score = 0;
  for (const kw of keywords) {
    const k = String(kw).toLowerCase();
    if (tags.includes(k)) score += tagWeight;
    else if (contains(desc, k)) score += textWeight;
  }
  return score;
}

function isColorProduct(tags, desc) {
  return (
    tags.includes("dye") ||
    tags.includes("color") ||
    tags.includes("toner") ||
    contains(desc, "shade") ||
    contains(desc, "toner") ||
    contains(desc, "color")
  );
}

function itemHasImage(item) {
  return typeof item?.image === "string" && item.image.length > 0;
}
