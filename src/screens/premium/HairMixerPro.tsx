// =============================
// File: client/src/screens/premium/HairMixerPro.js
// SDK: Expo SDK 54 · React Native (JS)
// FINAL: PremiumContext gate + one-time tips + functional coach arrows
// Fixes:
// - Uses PremiumContext (single source of truth) + "PremiumGate" screen
// - Split slider uses actual frame width (NOT full screen width)
// - Permissions requested only when needed
// - WebView message listener supports both window + document
// =============================

import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Animated,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";

// ✅ One-time tips overlay
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";

// ✅ Premium SVG icon system (NO FONT FILES)
import { Icon } from "../../components/Icons";

// ✅ Premium gate system (single source of truth)
import { usePremium } from "../../context/PremiumContext";

const GUIDE_KEY = "@omnitintai:guide_hair_mixer_pro_v2";
const FEATURE_KEY = "hair-mixer-pro"; // ensure this key exists in PremiumContext defaults

const SAMPLE_IMAGE = require("../../../assets/sample_face.jpg");
const { width: SCREEN_W } = Dimensions.get("window");

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

  async function handlePayload(payload){
    const { base64, color, intensity, feather } = payload || {};
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
      for(let i=0;i<W*H;i++){
        const j=i*4;
        maskImg[j]=255;maskImg[j+1]=255;maskImg[j+2]=255;maskImg[j+3]=blurred[j+3];
      }
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
  }

  // RN WebView -> Android uses document, iOS often uses window; support both.
  document.addEventListener('message', (e)=>{ try{ handlePayload(JSON.parse(e.data||'{}')); }catch(err){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', message:String(err)}));
  }});
  window.addEventListener('message', (e)=>{ try{ handlePayload(JSON.parse(e.data||'{}')); }catch(err){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', message:String(err)}));
  }});
</script>
</body></html>`;

export default function HairMixerPro() {
  const route = useRoute();
  const navigation = useNavigation();

  const { hydrated, isPremium, usesLeft, incrementUse } = usePremium();

  const mixedColor = String(route.params?.mixedColor || "#3A00FF").toUpperCase();

  const webRef = useRef(null);
  const collageRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState(null); // { uri, base64 }
  const [afterUrl, setAfterUrl] = useState(null); // data URL
  const [maskUrl, setMaskUrl] = useState(null); // data URL
  const [showMask, setShowMask] = useState(false);

  const [split, setSplit] = useState(0.5);
  const [intensity, setIntensity] = useState(0.85);
  const [feather, setFeather] = useState(4);

  // ✅ FIX: measure frame width (don’t assume screen width)
  const [frameW, setFrameW] = useState(SCREEN_W - 32);

  // v2: Pro Tips + coach arrows
  const [showGuide, setShowGuide] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const coachOpacity = useRef(new Animated.Value(0)).current;

  const showCoachMarks = useCallback(() => {
    setShowCoach(true);
    Animated.timing(coachOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(coachOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setShowCoach(false));
    }, 3600);
  }, [coachOpacity]);

  // Gate on focus (hard gate)
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;
      if (!isPremium) {
        const left = usesLeft(FEATURE_KEY);
        if (left <= 0) {
          navigation.replace("PremiumGate", {
            feature: "Hair Mixer Pro",
            usesLeft: left,
          });
          return;
        }
      }
    }, [hydrated, isPremium, usesLeft, navigation])
  );

  // Show guide once (only when allowed)
  useEffect(() => {
    (async () => {
      if (!hydrated) return;
      if (!isPremium && usesLeft(FEATURE_KEY) <= 0) return;

      try {
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
      } catch {}
    })();
  }, [hydrated, isPremium, usesLeft]);

  // Reprocess on slider change
  useEffect(() => {
    if (photo?.base64 && ready) runSegment(photo.base64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, feather]);

  const ensureAllowedAndCountUse = async () => {
    if (isPremium) return true;

    const left = usesLeft(FEATURE_KEY);
    if (left <= 0) {
      navigation.navigate("PremiumGate", {
        feature: "Hair Mixer Pro",
        usesLeft: left,
      });
      return false;
    }

    // Count a use when the user actually processes a photo
    await incrementUse(FEATURE_KEY);
    return true;
  };

  const requestMinimalConsent = () =>
    new Promise((resolve) => {
      Alert.alert(
        "Before you edit",
        "This preview is informational only. By continuing, you confirm you have permission to use this photo.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Continue", onPress: () => resolve(true) },
        ]
      );
    });

  const preparePermissions = async () => {
    // Ask only when needed (feels more premium)
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await ImagePicker.requestCameraPermissionsAsync();
    await MediaLibrary.requestPermissionsAsync();
  };

  const choose = async () => {
    const consent = await requestMinimalConsent();
    if (!consent) return;

    const ok = await ensureAllowedAndCountUse();
    if (!ok) return;

    await preparePermissions();

    const r = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
      base64: true,
    });

    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const edited = await ImageManipulator.manipulateAsync(a.uri, [], {
        compress: 1,
        base64: true,
      });

      setPhoto({ uri: edited.uri, base64: edited.base64 });
      setAfterUrl(null);
      setMaskUrl(null);

      runSegment(edited.base64);
      showCoachMarks();
    }
  };

  const snap = async () => {
    const consent = await requestMinimalConsent();
    if (!consent) return;

    const ok = await ensureAllowedAndCountUse();
    if (!ok) return;

    await preparePermissions();

    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
      base64: true,
    });

    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const edited = await ImageManipulator.manipulateAsync(a.uri, [], {
        compress: 1,
        base64: true,
      });

      setPhoto({ uri: edited.uri, base64: edited.base64 });
      setAfterUrl(null);
      setMaskUrl(null);

      runSegment(edited.base64);
      showCoachMarks();
    }
  };

  const runSegment = (base64) => {
    if (!ready) {
      Alert.alert("Model loading", "One moment…");
      return;
    }
    webRef.current?.postMessage(
      JSON.stringify({
        base64,
        color: mixedColor,
        intensity,
        feather,
      })
    );
  };

  const onMsg = async (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data || "{}");

      if (msg.type === "ready") {
        setReady(true);
        return;
      }
      if (msg.type === "error") {
        Alert.alert("Segmentation Error", String(msg.message));
        return;
      }
      if (msg.type === "done") {
        setAfterUrl(msg.afterUrl);
        setMaskUrl(msg.maskUrl);

        const meta = {
          ts: Date.now(),
          w: msg.w,
          h: msg.h,
          elapsedMs: msg.elapsedMs,
          color: mixedColor,
          intensity,
          feather,
          device: Platform.OS + " " + Platform.Version,
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
      await MediaLibrary.requestPermissionsAsync();

      const base64 = afterUrl.split(",")[1];
      const file = FileSystem.cacheDirectory + `after_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(file, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

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
      await MediaLibrary.requestPermissionsAsync();

      const uri = await captureRef(collageRef, { format: "jpg", quality: 0.95 });
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("OmniTintAI", asset, false);
      Alert.alert("Saved", "Before|After collage saved to gallery.");
    } catch (e) {
      Alert.alert("Save failed", String(e));
    }
  };

  const leftUri = photo?.uri || Image.resolveAssetSource(SAMPLE_IMAGE).uri;
  const rightUri = showMask ? maskUrl || leftUri : afterUrl || leftUri;

  // If not hydrated yet, keep UI simple (avoid flicker)
  if (!hydrated) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#111", fontWeight: "700" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => {
          setShowGuide(false);
          showCoachMarks();
        }}
        title="Pro tips for Hair Mixer Pro"
        bullets={[
          "Drag the split line to compare Before vs After in real time.",
          "Increase Feather to soften the edge of the hair mask.",
          "Lower Intensity for more natural color blending.",
          "Use “Save After” for a clean export or save the collage for quick sharing.",
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={styles.title}>Hair Mixer Pro — Photo Editor</Text>

        {/* BEFORE/AFTER interactive frame */}
        <View
          style={styles.frame}
          onLayout={(e) => setFrameW(e.nativeEvent.layout.width)}
        >
          <View
            onStartShouldSetResponder={() => true}
            onResponderMove={(e) => {
              const x = e.nativeEvent.locationX;
              const next = Math.max(0.1, Math.min(0.9, x / Math.max(1, frameW)));
              setSplit(next);
            }}
          >
            <ImageBackground source={{ uri: leftUri }} style={styles.photo}>
              <View style={[styles.badge, { left: 8, top: 8 }]}>
                <Text style={styles.badgeTxt}>Before</Text>
              </View>

              <View style={[styles.badge, { right: 8, top: 8 }]}>
                <Text style={styles.badgeTxt}>{showMask ? "Mask" : "After"}</Text>
              </View>

              <View style={[styles.divider, { left: frameW * split - 1 }]} />

              <View style={[StyleSheet.absoluteFill, { left: frameW * split, overflow: "hidden" }]}>
                <Image
                  source={{ uri: rightUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              </View>

              {/* ✅ Functional coach arrows */}
              {showCoach && (
                <Animated.View style={[styles.coachLayer, { opacity: coachOpacity }]} pointerEvents="none">
                  <View style={[styles.coachPill, { top: 12, left: 12 }]}>
                    <View style={styles.coachRow}>
                      <Icon name="chevronRight" size={18} color="#fff" />
                      <Text style={styles.coachTxt}>Drag to compare</Text>
                    </View>
                  </View>

                  <View style={[styles.coachPill, { bottom: 14, right: 12 }]}>
                    <View style={styles.coachRow}>
                      <Text style={styles.coachTxt}>Save here</Text>
                      <Icon name="chevronDown" size={18} color="#fff" />
                    </View>
                  </View>
                </Animated.View>
              )}
            </ImageBackground>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={choose}>
            <Text style={styles.btnTxt}>Upload Photo</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={snap}>
            <Text style={styles.btnTxt}>Take Photo</Text>
          </Pressable>
        </View>

        {/* Controls */}
        <View style={styles.controlsBox}>
          <Text style={styles.sectionTitle}>Adjustments</Text>

          <Text style={styles.sliderLabel}>Intensity: {intensity.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            value={intensity}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            onValueChange={setIntensity}
            minimumTrackTintColor="#111"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#000"
          />

          <Text style={styles.sliderLabel}>Feather: {feather}</Text>
          <Slider
            style={styles.slider}
            value={feather}
            minimumValue={0}
            maximumValue={12}
            step={1}
            onValueChange={setFeather}
            minimumTrackTintColor="#111"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#000"
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

          {!isPremium && (
            <Text style={styles.freeHint}>
              Free uses left: {Math.max(0, usesLeft(FEATURE_KEY))} • Upgrade for unlimited.
            </Text>
          )}

          <Text style={styles.microDisclaimer}>Informational preview only — not medical advice.</Text>
        </View>

        {/* Hidden collage layout for capture (Before | After) */}
        <View
          collapsable={false}
          ref={collageRef}
          style={{
            width: SCREEN_W - 32,
            aspectRatio: 3 / 2,
            position: "absolute",
            left: -9999,
            top: -9999,
          }}
        >
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
  photo: { width: "100%", height: (SCREEN_W - 32) * 1.2 },

  badge: {
    position: "absolute",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxt: { fontWeight: "700", color: "#333" },

  divider: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "#fff" },

  // Coach overlay
  coachLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  coachPill: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.70)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  coachRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  coachTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, backgroundColor: "#111", paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  btnTxt: { color: "#fff", textAlign: "center", fontWeight: "700" },

  controlsBox: {
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginTop: 8,
  },
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

  freeHint: { marginTop: 10, fontSize: 11, color: "#6B7280", textAlign: "center" },
  microDisclaimer: { marginTop: 8, fontSize: 11, color: "#9CA3AF", textAlign: "center" },
});
