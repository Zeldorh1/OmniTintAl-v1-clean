// client/src/utils/personalizerTiny.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tiny_personalizer_v1';
const sigmoid = z => 1 / (1 + Math.exp(-z));
const dot = (a, b) => a.reduce((s, v, i) => s + (v || 0) * (b[i] || 0), 0);

async function loadTiny(dim = 32) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (Array.isArray(o.w) && typeof o.b === 'number') return o;
    }
  } catch {}
  return { w: new Array(dim).fill(0), b: 0 };
}

export async function predictTiny(x) {
  const m = await loadTiny(x.length);
  return sigmoid(dot(m.w, x) + m.b);
}

export async function learnTiny(x, y, lr = 0.05) {
  const m = await loadTiny(x.length);
  const p = sigmoid(dot(m.w, x) + m.b);
  const err = p - y;
  for (let i = 0; i < m.w.length; i++) m.w[i] -= lr * err * (x[i] || 0);
  m.b -= lr * err;
  await AsyncStorage.setItem(KEY, JSON.stringify(m));
  return p;
}
