// client/src/utils/hairRules.js
// Map scan metrics into issues + recommendations.

const pct = (v) => Math.max(0, Math.min(1, Number(v) || 0));

/** Returns { overall, issues[], cta } */
export function evaluateScan(scan) {
  // Defensive defaults
  const s = {
    dryness: pct(scan?.dryness),
    splitEnds: pct(scan?.splitEnds),
    scalpOil: pct(scan?.scalpOil),
    frizz: pct(scan?.frizz),
    shine: pct(scan?.shine),
    colorDamage: pct(scan?.colorDamage),
    breakage: pct(scan?.breakage),
    dandruff: pct(scan?.dandruff || 0), // optional if you add it later
  };

  // Thresholds (tweak freely)
  const T = {
    mild: 0.33,
    moderate: 0.55,
    high: 0.75,
  };

  const issues = [];

  // Helper to push an issue card
  const add = (key, score, title, tips = [], rec = []) => {
    let level = 'mild';
    if (score >= T.high) level = 'high';
    else if (score >= T.moderate) level = 'moderate';

    if (score < T.mild) return; // don’t show very low items

    issues.push({
      key,
      score,
      level,        // 'mild' | 'moderate' | 'high'
      title,        // shown to user
      tips,         // bullet list
      recommend: rec,  // lightweight recommendation tags we can use for bundles/filters
    });
  };

  // Define per-metric mapping
  add('dryness', s.dryness, 'Dryness',
    [
      'Wash 2–3×/week with hydrating shampoo.',
      'Use a weekly deep-conditioning mask.',
      'Avoid 200°F+ heat styling; use heat protectant.',
    ],
    ['hydration', 'mask', 'leave-in']
  );

  add('splitEnds', s.splitEnds, 'Split Ends',
    [
      'Schedule a dusting/trim of ends.',
      'Use bond-repair treatments weekly.',
      'Sleep on a silk pillowcase to reduce friction.',
    ],
    ['bond-repair', 'serum', 'silk-accessory']
  );

  add('scalpOil', s.scalpOil, 'Oily Scalp',
    [
      'Clarify 1×/week to reset scalp.',
      'Focus shampoo at roots; rinse thoroughly.',
      'Lightweight conditioners mid-length to ends only.',
    ],
    ['clarifying', 'light-conditioner']
  );

  add('frizz', s.frizz, 'Frizz',
    [
      'Add silicone-free smoothing serum to damp hair.',
      'Microfiber towel or cotton tee to dry.',
      'Avoid over-brushing; use wide-tooth comb.',
    ],
    ['anti-frizz', 'serum', 'microfiber']
  );

  add('shine', 1 - s.shine, 'Dullness',
    [
      'Use glossing treatment monthly.',
      'Cool water final rinse.',
      'UV protectant when outdoors.',
    ],
    ['gloss', 'uv-protectant']
  );

  add('colorDamage', s.colorDamage, 'Color Damage',
    [
      'Purple/blue toning as needed.',
      'Bond-building weekly.',
      'Reduce hot tools; protect before styling.',
    ],
    ['bond-repair', 'toning', 'heat-protectant']
  );

  add('breakage', s.breakage, 'Breakage',
    [
      'Protein mask 1×/week until strength improves.',
      'Looser styles; avoid tight elastics.',
      'Detangle from ends upward.',
    ],
    ['protein-mask', 'gentle-brush']
  );

  add('dandruff', s.dandruff, 'Flaking/Dandruff',
    [
      'Use zinc pyrithione or ketoconazole shampoo.',
      'Rinse scalp thoroughly; don’t scratch.',
      'Consult a dermatologist if persistent.',
    ],
    ['dandruff-shampoo']
  );

  // Overall “care need” similar to your heuristic
  const overall =
    s.dryness * 0.22 +
    s.splitEnds * 0.22 +
    s.colorDamage * 0.2 +
    s.breakage * 0.16 +
    s.frizz * 0.1 +
    (1 - s.shine) * 0.05 +
    s.scalpOil * 0.05; // treat oil as care but a bit lighter

  // CTA suggestion (for ProductBundleScreen filters)
  // merge recommend tags from top 2 issues by score
  const top = [...issues].sort((a, b) => b.score - a.score).slice(0, 2);
  const recTags = [...new Set(top.flatMap(i => i.recommend))];

  return {
    overall,                  // 0..1
    issues,                   // array of {key, score, level, title, tips[], recommend[]}
    cta: {
      bundleFilters: recTags, // pass to ProductBundleScreen
      accessoryMode: issues.length === 0 || overall < 0.33, // if basically “good”
    }
  };
}
