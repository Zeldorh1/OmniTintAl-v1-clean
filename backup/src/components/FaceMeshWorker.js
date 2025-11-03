// client/src/components/FaceMeshWorker.js
import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * FaceMeshWorker
 * - Runs MediaPipe FaceLandmarker (Tasks Vision) inside a WebView
 * - Downscales image for speed, analyzes once, and posts back:
 *    { points, meta, derived, features, featureVector }
 *
 * Props:
 *  - imageBase64: string (NO "data:" prefix)
 *  - onResult: ({ points, meta, derived, features, featureVector }) => void
 *  - onError:  (Error) => void
 *  - timeoutMs?: number (optional; default cold=25s/warm=10s)
 *
 * Notes:
 *  - points are normalized to ORIGINAL image (x,y in 0..1)
 *  - meta: { width,height, ms, warm, brightness, contrast, blurVar, bbox:{x,y,w,h} }
 *  - derived: coarse ratios (lengthToWidth, bboxArea, centerOffsetX/Y)
 *  - features: a stable, ML-ready dictionary you can evolve later
 *  - featureVector: numeric array ready for your personalizer
 */

// ---------- Helper: turn returned meta/derived into a stable vector ----------
export function toUserFeatureVector({ meta, derived } = {}) {
  // Normalize/clip to keep the model stable
  const nz = (v, d = 0) => (Number.isFinite(v) ? v : d);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const lengthToWidth = nz(derived?.lengthToWidth, 1);     // ~1.2–1.7 typical
  const bboxArea      = clamp01(nz(derived?.bboxArea, 0)); // 0..1
  const cx            = clamp01((nz(derived?.centerOffsetX, 0) + 1) / 2); // map -1..1 -> 0..1
  const cy            = clamp01((nz(derived?.centerOffsetY, 0) + 1) / 2);
  // Brightness/contrast in 0..255-ish range; blurVar is arbitrary → squash
  const bright   = Math.min(255, Math.max(0, nz(meta?.brightness, 128))) / 255;
  const contrast = Math.min(255, Math.max(0, nz(meta?.contrast, 64))) / 255;
  const blurVar  = Math.tanh(nz(meta?.blurVar, 0) / 5000); // squashed to ~0..1

  // Compose vector (keep order stable; append when evolving)
  return [
    lengthToWidth, // 0
    bboxArea,      // 1
    cx,            // 2
    cy,            // 3
    bright,        // 4
    contrast,      // 5
    blurVar,       // 6
  ];
}

export default function FaceMeshWorker({ imageBase64, onResult, onError, timeoutMs }) {
  const webRef = useRef(null);

  const html = useMemo(
    () => `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>html,body{margin:0;padding:0;background:#fff}</style>
<script>
  const RN = { post: (msg)=>window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)) };
  function bridge(ev){ try{ window.dispatchEvent(new MessageEvent('message', { data: ev.data })); }catch(e){} }
  document.addEventListener('message', bridge);
  window.addEventListener('message', bridge);
</script>

<script type="module">
  import {
    FilesetResolver,
    FaceLandmarker,
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.5/vision_bundle.mjs";

  const RN = { post: (msg)=>window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)) };

  let landmarker = null;
  let warm = false;
  let booting = false;

  async function ensureLandmarker(){
    if (landmarker || booting) return;
    booting = true;
    RN.post({ type: "status", step: "downloading-models" });
    const resolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.5/wasm"
    );
    landmarker = await FaceLandmarker.createFromOptions(resolver, {
      runningMode: "IMAGE",
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
      },
      numFaces: 1,
      outputFaceBlendshapes: false,
      minFaceDetectionConfidence: 0.25,
      minFacePresenceConfidence: 0.25,
      minTrackingConfidence: 0.25
    });
    RN.post({ type: "ready" });
  }

  function resizeCanvas(src, max=1024){
    const s = Math.min(max/src.width, max/src.height, 1);
    if (s >= 1) return src;
    const c = document.createElement("canvas");
    c.width = Math.round(src.width*s);
    c.height = Math.round(src.height*s);
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  // ---------- fast image stats for ML/telemetry ----------
  function statsFromCanvas(src) {
    const maxW = 256;
    const s = Math.min(maxW / src.width, maxW / src.height, 1);
    const c = document.createElement('canvas');
    c.width = Math.round(src.width * s);
    c.height = Math.round(src.height * s);
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, c.width, c.height);
    const { data, width, height } = g.getImageData(0, 0, c.width, c.height);

    const luma = new Float32Array(width * height);
    let sum = 0, sum2 = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      luma[p] = y; sum += y; sum2 += y * y;
    }
    const n = luma.length;
    const mean = sum / n;
    const variance = Math.max(sum2 / n - mean * mean, 0);
    const contrast = Math.sqrt(variance);

    // Laplacian variance (blur)
    const K = [0,1,0,1,-4,1,0,1,0];
    let lapSum=0, lap2=0, cnt=0;
    for (let y=1; y<height-1; y++){
      for (let x=1; x<width-1; x++){
        const i = y*width + x;
        const L =
          K[0]*luma[i - width - 1] + K[1]*luma[i - width] + K[2]*luma[i - width + 1] +
          K[3]*luma[i - 1]        + K[4]*luma[i]         + K[5]*luma[i + 1] +
          K[6]*luma[i + width - 1]+ K[7]*luma[i + width] + K[8]*luma[i + width + 1];
        lapSum += L; lap2 += L*L; cnt++;
      }
    }
    const lapMean = lapSum / Math.max(cnt,1);
    const blurVar = Math.max(lap2 / Math.max(cnt,1) - lapMean*lapMean, 0);

    return { brightness: mean, contrast, blurVar };
  }

  // ---------- simple derived features from landmarks ----------
  function bboxFromLandmarks(pts){
    let minX=1, minY=1, maxX=0, maxY=0;
    for (const p of pts){ if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x; if(p.y<minY)minY=p.y; if(p.y>maxY)maxY=p.y; }
    return { x:minX, y:minY, w:Math.max(0,maxX-minX), h:Math.max(0,maxY-minY) };
  }
  function derivedFrom(pts, srcW, srcH){
    const bbox = bboxFromLandmarks(pts);
    const cx = (bbox.x + bbox.w/2) * 2 - 1; // center offset [-1..1]
    const cy = (bbox.y + bbox.h/2) * 2 - 1;
    const lw = (bbox.h * srcH) / Math.max(1, bbox.w * srcW); // lengthToWidth (pixel ratio on src)
    const area = Math.max(0, Math.min(1, bbox.w * bbox.h));
    return { lengthToWidth: lw, bboxArea: area, centerOffsetX: cx, centerOffsetY: cy };
  }

  async function analyze(b64){
    try{
      await ensureLandmarker();
      const img = new Image();
      img.onload = async () => {
        const W = img.width, H = img.height;
        const src = resizeCanvas(img, 1024);

        const t0 = performance.now();
        const res = landmarker.detect(src);
        const t1 = performance.now();
        warm = true;

        const ptsN = res?.faceLandmarks?.[0];
        if (!ptsN) { RN.post({ error: "No face detected" }); return; }

        // meta/derived
        const st = statsFromCanvas(src);
        const drv = derivedFrom(ptsN, src.width, src.height);

        // Remap to ORIGINAL image coords (0..1)
        const pts = ptsN.map(p => ({
          x: (p.x * src.width) / W,
          y: (p.y * src.height) / H,
          z: p.z
        }));

        RN.post({
          points: pts,
          meta: { width: W, height: H, ms: Math.round(t1 - t0), warm, ...st, bbox: drv ? { x:drv.centerOffsetX, y:drv.centerOffsetY, w:drv.bboxArea, h:drv.bboxArea } : null },
          derived: drv
        });
      };
      img.onerror = () => RN.post({ error: "Image load failed" });
      img.src = "data:image/jpeg;base64," + b64;
    }catch(e){
      RN.post({ error: e?.message || String(e) });
    }
  }

  window.addEventListener("message", (ev) => {
    try{
      const m = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
      if (m?.type === "analyze" && m.b64) analyze(m.b64);
    }catch(e){}
  });

  // pre-load model
  ensureLandmarker().catch(e=>RN.post({ error: e?.message || String(e) }));
  RN.post({ type: "booted" });
</script>
</head>
<body></body>
</html>
`,
    []
  );

  // timeouts
  const COLD_TIMEOUT = timeoutMs ?? 25000;
  const WARM_TIMEOUT = Math.min(COLD_TIMEOUT, 10000);

  const runAnalyze = (b64) => {
    let timedOut = false;
    let done = false;
    let isWarm = false;

    const coldTimer = setTimeout(() => {
      timedOut = true;
      if (!done) onError?.(new Error("Timed out"));
    }, COLD_TIMEOUT);

    const onMsg = (e) => {
      try{
        const data = JSON.parse(e.nativeEvent.data || "{}");
        if (data?.type === "ready") {
          isWarm = true;
          clearTimeout(coldTimer);
          // arm warm timeout
          setTimeout(() => { if (!done) onError?.(new Error("Timed out")); }, WARM_TIMEOUT);
          return;
        }
        if (data?.points) {
          done = true;
          clearTimeout(coldTimer);

          const meta = data.meta || {};
          const derived = data.derived || {};
          // Build an ML-ready vector here so screens don't have to:
          const featureVector = toUserFeatureVector({ meta, derived });

          onResult?.({
            points: data.points,
            meta,
            derived,
            features: {
              lengthToWidth: derived.lengthToWidth,
              bboxArea: derived.bboxArea,
              centerOffsetX: derived.centerOffsetX,
              centerOffsetY: derived.centerOffsetY,
              brightness: meta.brightness,
              contrast: meta.contrast,
              blurVar: meta.blurVar,
            },
            featureVector,
          });
          return;
        }
        if (data?.error) {
          done = true;
          clearTimeout(coldTimer);
          onError?.(new Error(data.error));
        }
      }catch(err){
        done = true;
        clearTimeout(coldTimer);
        onError?.(err);
      }
    };

    // RN WebView uses onMessage prop; stash handler
    webRef._onMessage = onMsg;

    try {
      webRef.current?.postMessage(JSON.stringify({ type: 'analyze', b64 }));
    } catch (e) {
      clearTimeout(coldTimer);
      onError?.(e);
    }
  };

  return (
    <View style={{ width: 1, height: 1, overflow: 'hidden' }}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        source={{ html }}
        onMessage={(e) => webRef._onMessage?.(e)}
        onError={() => onError?.(new Error('WebView error'))}
        onHttpError={() => onError?.(new Error('HTTP error in WebView'))}
        onLoadEnd={() => {
          if (imageBase64) runAnalyze(imageBase64);
        }}
      />
    </View>
  );
}
