// client/src/config/affiliate.ts
// -----------------------------------------------------------
//  OmniTintAI® Amazon Affiliate Link Builder (Flagship v2)
//  - Prevents double-tagging
//  - Works with any Amazon domain
//  - Centralized tracking parameters
// -----------------------------------------------------------

export const ASSOCIATE_TAG = 'omnitintai07-20';

export function buildAffiliateLink(url: string) {
  try {
    const u = new URL(url);

    // Do not double-tag
    if (!u.searchParams.has('tag')) {
      u.searchParams.set('tag', ASSOCIATE_TAG);
    }

    // Optional tracking enhancements (Amazon-friendly)
    if (!u.searchParams.has('linkCode')) u.searchParams.set('linkCode', 'll1');
    if (!u.searchParams.has('language')) u.searchParams.set('language', 'en_US');
    if (!u.searchParams.has('ref')) u.searchParams.set('ref', 'omnitintai');

    return u.toString();
  } catch (err) {
    console.warn('Invalid URL passed to buildAffiliateLink:', url);
    return url;
  }
}
