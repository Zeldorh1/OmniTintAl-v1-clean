// Safe stub for experimental AI Styles screen.
// Later we’ll replace this with real MediaPipe logic.
export async function analyzeAsync() {
  return {
    landmarks: [],
    vector: [],
    meta: { ok: false, reason: 'stub' },
  };
}
