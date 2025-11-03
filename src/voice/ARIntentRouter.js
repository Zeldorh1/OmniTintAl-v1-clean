import tinycolor from 'tinycolor2';

// Minimal shade map — extend with your catalog
const SHADE_MAP = {
  'r3': '#C12A2A',
  '5n': '#4A341F',
  '6n': '#6A4F35',
  'platinum': '#E6E6E6',
  'auburn': '#8D3C2B',
  'chestnut': '#6B3F2C',
  'jet black': '#0A0A0A',
  'red': '#C12A2A',
  'blue': '#2F57D3',
  'green': '#2DBE5A',
};

// normalize color token → hex
function colorToHex(token) {
  const key = token.toLowerCase().replace(/\s+/g, '');
  if (SHADE_MAP[key]) return SHADE_MAP[key];
  const tc = tinycolor(token);
  return tc.isValid() ? tc.toHexString() : null;
}

// extract helpers
const re = {
  color: /(with|to|in)\s+([a-zA-Z0-9\s]+?)\s*(hair|color|dye)?$/i,
  shade: /(r\d+|[1-9]n|platinum|auburn|chestnut|jet black)/i,
  style: /(bob|braids?|locs?|dreads?|pixie|bangs|fade|curly|wavy|straight)/i,
  length: /(short(er)?|long(er)?|medium)/i,
  rotate: /(rotate|turn)\s+(left|right)/i,
  zoom: /(zoom|scale)\s+(in|out)/i,
  reset: /\b(reset|start over|clear)\b/i,
  age: /\b(older|younger)\b/i,
};

export function routeIntent(utterance, { ar }) {
  const text = utterance.toLowerCase().trim();

  // reset
  if (re.reset.test(text)) return ar.reset('Resetting.');

  // rotate
  const mRot = text.match(re.rotate);
  if (mRot) return ar.rotate(mRot[2] === 'left' ? -15 : +15, `Rotating ${mRot[2]}.`);

  // zoom
  const mZoom = text.match(re.zoom);
  if (mZoom) return ar.zoom(mZoom[2] === 'in' ? 1.15 : 0.87, `Zooming ${mZoom[2]}.`);

  // style
  const mStyle = text.match(re.style);
  if (mStyle) return ar.setStyle(mStyle[1], `Trying ${mStyle[1]} style.`);

  // length / bangs
  const mLen = text.match(re.length);
  if (mLen) return ar.setLength(mLen[1], `Making it ${mLen[1]}.`);
  if (text.includes('shorter bangs')) return ar.setBangs('shorter', 'Shortening the bangs.');
  if (text.includes('longer bangs'))  return ar.setBangs('longer', 'Lengthening the bangs.');

  // color by explicit shade code
  const mShade = text.match(re.shade);
  if (mShade) {
    const hex = colorToHex(mShade[0]);
    if (hex) return ar.setColor(hex, `Applying ${mShade[0]} shade.`);
  }

  // color by phrase (“with red hair” / “in platinum”)
  const mColor = text.match(re.color);
  if (mColor) {
    const hex = colorToHex(mColor[2]);
    if (hex) return ar.setColor(hex, `Applying ${mColor[2]}.`);
  }

  // age transform placeholders (hook your filter pipeline)
  const mAge = text.match(re.age);
  if (mAge) return ar.setAge(mAge[1], `Subtle ${mAge[1]} look.`);

  return ar.say("I heard you, but didn't recognize that command. Try: show me bob, with red R3, rotate left, zoom in, reset.");
}
