// client/src/utils/grokHairScannerBundles/grokStylist.js
import { API_URL } from "../../config/api";
/**
 * askGrokStylist
 *
 * question: string (user message)
 * omniContext: object from buildOmniContext (or similar)
 * filters: reserved, for future (e.g. no bleach, under $40) – currently unused
 * mode: 'standard' | 'bundle' etc. (affects temperature/prompt style server-side)
 */
export async function askGrokStylist(
  question,
  omniContext = {},
  filters = [],
  mode = 'standard'
) {
  try {
    const res = await fetch(`${API_URL}/grok-stylist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        omniContext,
        filters,
        mode,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log('[askGrokStylist] worker error', res.status, text);
      throw new Error('Upstream AI error');
    }

    const data = await res.json();
    return data.answer || "I’m having trouble thinking right now. Try again in a moment.";
  } catch (e) {
    console.log('[askGrokStylist] error', e);
    return "I’m having trouble thinking right now. Try again in a moment.";
  }
}
