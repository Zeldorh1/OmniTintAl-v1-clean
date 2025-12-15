// client/src/utils/grokHairScannerBundles/bundleCurator.js
import { API_URL } from '@/config/api';
import { buildOmniContext } from '@/utils/buildOmniContext';

/**
 * curateBundle
 *
 * One function to get a fully personalized bundle for a user.
 *
 * Usage:
 *  const bundle = await curateBundle({ omniContext, userId });
 *  const bundle = await curateBundle({ health: scan, cart, progress, look });
 */
export async function curateBundle(options = {}) {
  const {
    omniContext,
    look,
    health,
    progress,
    cart,
    userId,
  } = options;

  // Use provided omniContext or build it from pieces
  const ctx = omniContext || buildOmniContext({ look, health, progress, cart });

  const payload = {
    userId: userId || ctx.currentLook?.hairstyleId || 'anon',
    scan: ctx.hairHealth,
    progress: ctx.progress,
    purchases: ctx.inBag,
  };

  const res = await fetch(`${API_URL}/ml-hair-brain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log('[curateBundle] worker error', res.status, text);
    throw new Error('Failed to build personalized bundle');
  }

  const data = await res.json();

  const bundleName =
    data.bundleName ||
    (data.recommendations?.shouldPrioritizeRepair
      ? 'Your Custom Repair Kit'
      : 'Your Personal Hair Plan');

  const products = data.products || [];
  const why =
    data.why ||
    `Built for your dryness (${ctx.hairHealth.dryness}/10), damage and growth pattern.`;

  return {
    bundleName,
    products,
    why,
    recommendations: data.recommendations || {},
  };
}
