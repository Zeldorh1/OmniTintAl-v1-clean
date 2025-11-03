// =============================
// File: client/src/screens/premium/HairMixerPro.js
// SDK: Expo SDK 54 · React Native (JS)
// =============================

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import { useRoute } from "@react-navigation/native";

const SAMPLE_IMAGE = require("../../../assets/sample_face.jpg");
const { width } = Dimensions.get("window");

/** WebWorker (MediaPipe Tasks - selfie_multiclass) */
const WORKER_HTML = `<!doctype html><html><body style="margin:0">
<canvas id="c"></canvas>
<script type="module">
  import { ImageSegmenter, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
  const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
  const seg = await ImageSegmenter.createFromOptions(files, {
    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass/float32/1/selfie_multiclass.tflite' },
    runningMode: 'IMAGE', outputCategoryMask: true
  });
  const HAIR = 2;
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');

  function hexToRgb(hex){hex=hex.replace('#','');return{r:parseInt(hex.slice(0,2),16),g:parseInt(hex.slice(2,4),16),b:parseInt(hex.slice(4,6),16)}}
  function blurAlpha(d,w,h,r){
    r=Math.max(0,Math.floor(r)); if(!r) return d;
    const t=new Uint8ClampedArray(d.length);
    for(let y=0;y<h;y++){let s=0,cnt=0,idx=y*w*4;for(let x=0;x<w;x++){s+=d[idx+3];cnt++;if(x>=r){s-=d[idx-r*4+3];cnt--;}t[idx+3]=s/cnt;idx+=4;}}
    const o=new Uint8ClampedArray(d.length);
    for(let x=0;x<w;x++){let s=0,cnt=0,idx=x*4;for(let y=0;y<h;y++){s+=t[idx+3];cnt++;if(y>=r){s-=t[idx-r*w*4+3];cnt--;}o[idx+3]=s/cnt;idx+=w*4;}}
    return o;
  }
  function tintComposite(img,mask,w,h,color,intensity){
    const {r:tr,g:tg,b:tb}=hexToRgb(color);
    ctx.drawImage(img,0,0,w,h);
    const base=ctx.getImageData(0,0,w,h);
    const out=ctx.createImageData(w,h);
    for(let i=0;i<w*h;i++){
      const j=i*4, a=(mask[j+3]/255)*intensity;
      out.data[j]   = Math.round(base.data[j]*(1-a)   + tr*a);
      out.data[j+1] = Math.round(base.data[j+1]*(1-a) + tg*a);
      out.data[j+2] = Math.round(base.data[j+2]*(1-a) + tb*a);
      out.data[j+3] = 255;
    }
    return out;
  }

  window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));

  document.addEventListener('message', async (e)=>{
    try{
      const { base64, color, intensity, feather } = JSON.parse(e.data||'{}');
      const img = new Image();
      img.onload = async ()=>{
        const W=img.width,H=img.height; c.width=W;c.height=H;
        const t0=performance.now();
        const result = await seg.segment(img);
        const labels = result.categoryMask.getAsUint8Array?.() || null;

        // Build hair alpha
        const alpha = new Uint8ClampedArray(W*H*4);
        for(let i=0;i<W*H;i++){
          const j=i*4;
          alpha[j+3] = labels ? (labels[i]===HAIR?255:0) : 0;
        }
        const blurred = blurAlpha(alpha,W,H,feather||0);

        // Mask preview URL (white hair on transparent)
        const maskImg = new Uint8ClampedArray(W*H*4);
        for(let i=0;i<W*H;i++){const j=i*4; maskImg[j]=255;maskImg[j+1]=255;maskImg[j+2]=255;maskImg[j+3]=blurred[j+3];}
        const maskImageData = new ImageData(maskImg,W,H);
        ctx.putImageData(maskImageData,0,0);
        const maskUrl = c.toDataURL('image/png');

        // After composite
        const out = tintComposite(img, blurred, W, H, color||'#3A00FF', Math.max(0,Math.min(1,intensity||0.85)));
        ctx.putImageData(out,0,0);
        const afterUrl = c.toDataURL('image/jpeg',0.95);
        const t1=performance.now();

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'done', w:W, h:H, afterUrl, maskUrl, elapsedMs:Math.round(t1-t0)
        }));
      };
      img.crossOrigin='anonymous';
      img.src='data:image/jpeg;base64,'+base64;
    }catch(err){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', message:String(err)}));
    }
  });
</script>
</body></html>`;

// --------------------------------------

export default function HairMixerPro() {
  const route = useRoute();
  const mixedColor = (route.params?.mixedColor || "#3A00FF").toUpperCase();

  const webRef = useRef(null);
  const collageRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState(null);         // { uri, base64 }
  const [afterUrl, setAfterUrl] = useState(null);   // data URL
  const [maskUrl, setMaskUrl] = useState(null);     // data URL
  const [showMask, setShowMask] = useState(false);

  const [split, setSplit] = useState(0.5);
  const [intensity, setIntensity] = useState(0.85);
  const [feather, setFeather] = useState(4);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await MediaLibrary.requestPermissionsAsync();
    })();
  }, []);

  // Reprocess on slider change
  useEffect(() => {
    if (photo?.base64 && ready) runSegment(photo.base64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, feather]);

  const choose = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [3, 4], quality: 1, base64: true,
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const edited = await ImageManipulator.manipulateAsync(a.uri, [], { compress: 1, base64: true });
      setPhoto({ uri: edited.uri, base64: edited.base64 });
      setAfterUrl(null); setMaskUrl(null);
      runSegment(edited.base64);
    }
  };

  const snap = async () => {
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [3, 4], quality: 1, base64: true,
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const edited = await ImageManipulator.manipulateAsync(a.uri, [], { compress: 1, base64: true });
      setPhoto({ uri: edited.uri, base64: edited.base64 });
      setAfterUrl(null); setMaskUrl(null);
      runSegment(edited.base64);
    }
  };

  const runSegment = (base64) => {
    if (!ready) { Alert.alert("Model loading", "One moment…"); return; }
    webRef.current?.postMessage(JSON.stringify({
      base64, color: mixedColor, intensity, feather
    }));
  };

  const onMsg = async (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data || "{}");
      if (msg.type === "ready") { setReady(true); return; }
      if (msg.type === "error") { Alert.alert("Segmentation Error", String(msg.message)); return; }
      if (msg.type === "done") {
        setAfterUrl(msg.afterUrl);
        setMaskUrl(msg.maskUrl);
        const meta = {
          ts: Date.now(), w: msg.w, h: msg.h, elapsedMs: msg.elapsedMs,
          color: mixedColor, intensity, feather, device: Platform.OS + " " + Platform.Version
        };
        try {
          const arr = JSON.parse((await AsyncStorage.getItem("@hairmix_telemetry")) || "[]");
          arr.push(meta);
          await AsyncStorage.setItem("@hairmix_telemetry", JSON.stringify(arr.slice(-200)));
        } catch {}
      }
    } catch {}
  };

  // ----- Save: After only -----
  const saveAfterToGallery = async () => {
    if (!afterUrl) return Alert.alert("Nothing to save", "Please process a photo first.");
    try {
      const base64 = afterUrl.split(",")[1];
      const file = FileSystem.cacheDirectory + `after_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(file, base64, { encoding: FileSystem.EncodingType.Base64 });
      const asset = await MediaLibrary.createAssetAsync(file);
      await MediaLibrary.createAlbumAsync("OmniTintAI", asset, false);
      Alert.alert("Saved", "After image saved to gallery.");
    } catch (e) {
      Alert.alert("Save failed", String(e));
    }
  };

  // ----- Save: Side-by-side Collage (Before | After) -----
  const saveCollageToGallery = async () => {
    if (!photo?.uri || !afterUrl) return Alert.alert("Missing", "Need a processed photo first.");
    try {
      // Capture a hidden view that lays out the two images side-by-side
      const uri = await captureRef(collageRef, { format: "jpg", quality: 0.95 });
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("OmniTintAI", asset, false);
      Alert.alert("Saved", "Before|After collage saved to gallery.");
    } catch (e) {
      Alert.alert("Save failed", String(e));
    }
  };

  const leftUri = photo?.uri || Image.resolveAssetSource(SAMPLE_IMAGE).uri;
  const rightUri = showMask ? (maskUrl || leftUri) : (afterUrl || leftUri);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={styles.title}>Hair Mixer Pro — Photo Editor</Text>

        {/* BEFORE/AFTER interactive frame */}
        <View style={styles.frame}>
          <View
            onStartShouldSetResponder={() => true}
            onResponderMove={(e) => setSplit(Math.max(0.1, Math.min(0.9, e.nativeEvent.locationX / width)))}
          >
            <ImageBackground source={{ uri: leftUri }} style={styles.photo}>
              <View style={[styles.badge, { left: 8, top: 8 }]}><Text style={styles.badgeTxt}>Before</Text></View>
              <View style={[styles.badge, { right: 8, top: 8 }]}><Text style={styles.badgeTxt}>{showMask ? "Mask" : "After"}</Text></View>
              <View style={[styles.divider, { left: width * split - 1 }]} />
              <View style={[StyleSheet.absoluteFill, { left: width * split, overflow: "hidden" }]}>
                <Image source={{ uri: rightUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={choose}><Text style={styles.btnTxt}>Upload Photo</Text></Pressable>
          <Pressable style={styles.btn} onPress={snap}><Text style={styles.btnTxt}>Take Photo</Text></Pressable>
        </View>

        {/* Controls */}
        <View style={styles.controlsBox}>
          <Text style={styles.sectionTitle}>Adjustments</Text>

          <Text style={styles.sliderLabel}>Intensity: {intensity.toFixed(2)}</Text>
          <Slider
            style={styles.slider} value={intensity}
            minimumValue={0} maximumValue={1} step={0.01}
            onValueChange={setIntensity}
            minimumTrackTintColor="#111" maximumTrackTintColor="#ccc" thumbTintColor="#000"
          />

          <Text style={styles.sliderLabel}>Feather: {feather}</Text>
          <Slider
            style={styles.slider} value={feather}
            minimumValue={0} maximumValue={12} step={1}
            onValueChange={setFeather}
            minimumTrackTintColor="#111" maximumTrackTintColor="#ccc" thumbTintColor="#000"
          />

          <View style={styles.colorRow}>
            <Text style={styles.sectionTitle}>Color</Text>
            <View style={[styles.swatch, { backgroundColor: mixedColor }]} />
            <Text style={styles.hex}>{mixedColor}</Text>
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Pressable style={styles.secondaryBtn} onPress={() => setShowMask((v) => !v)}>
              <Text style={styles.secondaryBtnTxt}>{showMask ? "Show After" : "Show Mask"}</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={saveAfterToGallery}>
              <Text style={styles.primaryBtnTxt}>Save After</Text>
            </Pressable>
          </View>

          <Pressable style={[styles.primaryBtn, { marginTop: 10 }]} onPress={saveCollageToGallery}>
            <Text style={styles.primaryBtnTxt}>Save Before | After Collage</Text>
          </Pressable>
        </View>

        {/* Hidden collage layout for capture (Before | After) */}
        <View collapsable={false} ref={collageRef} style={{ width: width - 32, aspectRatio: 3 / 2, position: "absolute", left: -9999, top: -9999 }}>
          <View style={{ flex: 1, flexDirection: "row" }}>
            <Image source={{ uri: leftUri }} style={{ flex: 1 }} resizeMode="cover" />
            <Image source={{ uri: afterUrl || leftUri }} style={{ flex: 1 }} resizeMode="cover" />
          </View>
        </View>
      </ScrollView>

      {/* Hidden worker */}
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: WORKER_HTML }}
        onMessage={onMsg}
        javaScriptEnabled
        style={{ width: 0, height: 0, opacity: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#111", textAlign: "center" },
  frame: { borderRadius: 16, overflow: "hidden", backgroundColor: "#eee" },
  photo: { width: "100%", height: width * 1.2 },
  badge: { position: "absolute", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeTxt: { fontWeight: "700", color: "#333" },
  divider: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "#fff" },
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, backgroundColor: "#111", paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  btnTxt: { color: "#fff", textAlign: "center", fontWeight: "700" },
  controlsBox: { padding: 12, backgroundColor: "#fafafa", borderRadius: 12, borderWidth: 1, borderColor: "#eee", marginTop: 8 },
  sectionTitle: { fontWeight: "700", color: "#111", marginBottom: 6 },
  sliderLabel: { fontWeight: "600", color: "#111", marginTop: 10 },
  slider: { width: "100%", height: 40 },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  swatch: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: "#ddd" },
  hex: { fontWeight: "800", color: "#111" },
  primaryBtn: { backgroundColor: "#111", borderRadius: 10, paddingVertical: 12, flex: 1, alignItems: "center" },
  primaryBtnTxt: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { borderColor: "#111", borderWidth: 1, borderRadius: 10, paddingVertical: 12, flex: 1, alignItems: "center" },
  secondaryBtnTxt: { color: "#111", fontWeight: "700" },
});
