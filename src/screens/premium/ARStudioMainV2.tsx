// client/src/screens/premium/ARStudioCoreScreen.js
// FINAL · FLAGSHIP AR TRY-ON CORE (GATED + LEGAL + NO VECTOR-ICONS)
// - Camera-based live preview
// - Soft “hair band” color overlay
// - Capture, Save, Share
// - PremiumContext gate with free-uses limit
// - One-time Pro Tips overlay + functional coach arrows

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Image,
  Share,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";

// ✅ Premium SVG icon system (NO FONT FILES)
import { Icon } from "../../components/Icons";

// ✅ One-time tips overlay
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";

// ✅ Single source of truth gate
import { usePremium } from "../../context/PremiumContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FRAME_SIZE = SCREEN_WIDTH * 0.86;

const GUIDE_KEY = "@omnitintai:guide_ar_tryon";
const FEATURE_KEY = "ar-try-on";

export default function ARStudioCoreScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hydrated, isPremium, usesLeft, incrementUse } = usePremium();

  const cameraRef = useRef(null);

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(null);

  const [type, setType] = useState(Camera.Constants.Type.front);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [capturedUri, setCapturedUri] = useState(null);

  // Pro tips + coach marks
  const [showGuide, setShowGuide] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const coachOpacity = useRef(new Animated.Value(0)).current;

  // Product passed from ProductDetails (optional)
  const product = route.params?.product || null;

  // Palette: if product has a hex, build around it; else neutral set
  const palette = product?.hex
    ? [String(product.hex).toUpperCase(), "#222222", "#888888", "#CC9966"]
    : ["#111111", "#4B5563", "#9CA3AF", "#D97757", "#B45309"];

  const goGate = useCallback(
    (left) => {
      navigation.replace("PremiumGate", {
        feature: "AR Try-On",
        usesLeft: left,
      });
    },
    [navigation]
  );

  // ─────────────────────────────────────────
  // Gate on focus (matches your other screens)
  // ─────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;

      if (!isPremium) {
        const left = usesLeft(FEATURE_KEY);
        if (left <= 0) {
          goGate(left);
          return;
        }
      }
    }, [hydrated, isPremium, usesLeft, goGate])
  );

  // Count one free use once when user is allowed in (non-premium)
  useEffect(() => {
    (async () => {
      if (!hydrated || isPremium) return;
      const left = usesLeft(FEATURE_KEY);
      if (left > 0) {
        await incrementUse(FEATURE_KEY);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ─────────────────────────────────────────
  // Permissions (only after allowed)
  // ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!hydrated) return;

      // If locked, don’t request permissions
      if (!isPremium && usesLeft(FEATURE_KEY) <= 0) return;

      const camStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(camStatus.status === "granted");

      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(mediaStatus.status === "granted");
    })();
  }, [hydrated, isPremium, usesLeft]);

  // Show guide once (after camera permission granted)
  useEffect(() => {
    (async () => {
      if (hasCameraPermission !== true) return;
      try {
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
      } catch {}
    })();
  }, [hasCameraPermission]);

  const showCoachMarks = () => {
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
    }, 3000);
  };

  const handleFlip = () => {
    setType((prev) =>
      prev === Camera.Constants.Type.front
        ? Camera.Constants.Type.back
        : Camera.Constants.Type.front
    );
  };

  // Capture still image
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      setSaving(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
      setCapturedUri(photo.uri);
    } catch (e) {
      console.warn("[ARStudioCore] capture error", e);
      Alert.alert("Capture failed", "Please try again.");
    } finally {
      setSaving(false);
    }
  }, []);

  // Save to gallery
  const handleSaveToGallery = useCallback(async () => {
    if (!capturedUri) return;
    try {
      if (!hasMediaPermission) {
        const status = await MediaLibrary.requestPermissionsAsync();
        if (status.status !== "granted") {
          Alert.alert("Permission needed", "Allow photo access to save your try-on.");
          return;
        }
        setHasMediaPermission(true);
      }
      await MediaLibrary.saveToLibraryAsync(capturedUri);
      Alert.alert("Saved", "Your try-on has been saved to your gallery.");
    } catch (e) {
      console.warn("[ARStudioCore] save error", e);
      Alert.alert("Save failed", "Please try again.");
    }
  }, [capturedUri, hasMediaPermission]);

  // Share sheet
  const handleShare = useCallback(async () => {
    if (!capturedUri) return;
    try {
      await Share.share({
        message: `Trying new hair color with OmniTintAI ✨`,
        url: capturedUri,
      });
    } catch (e) {
      console.warn("[ARStudioCore] share error", e);
    }
  }, [capturedUri]);

  // ─────────────────────────────────────────
  // Permission States
  // ─────────────────────────────────────────
  if (!hydrated || hasCameraPermission === null) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Preparing AR Studio…</Text>
      </SafeAreaView>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          OmniTintAI needs camera access to preview hair colors in real time.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={async () => {
            const status = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(status.status === "granted");
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────
  // MAIN UI
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => {
          setShowGuide(false);
          showCoachMarks();
        }}
        title="Pro tips for AR Try-On"
        bullets={[
          "Tap a shade below to preview it instantly.",
          "Use the capture button to save your favorite looks.",
          "Flip camera if lighting is better on the back camera.",
          "Better lighting = more realistic color preview.",
        ]}
      />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.topIconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.85}
        >
          <Icon name="close" size={20} color="#E5E7EB" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>AR Studio</Text>

        <TouchableOpacity
          onPress={handleFlip}
          style={styles.topIconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.85}
        >
          <Icon name="reset" size={20} color="#E5E7EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraWrap}>
        <Camera style={styles.camera} ref={cameraRef} type={type}>
          <View
            pointerEvents="none"
            style={[styles.overlayBand, { backgroundColor: `${selectedColor}AA` }]}
          />

          <View style={styles.frameCorners} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {showCoach && (
            <Animated.View
              style={[styles.coachLayer, { opacity: coachOpacity }]}
              pointerEvents="none"
            >
              <View style={[styles.coachHint, { top: "76%", left: 18 }]}>
                <View style={styles.coachRow}>
                  <Icon name="chevronDown" size={22} color="#fff" />
                  <Text style={styles.coachText}>Tap a shade</Text>
                </View>
              </View>

              <View style={[styles.coachHint, { bottom: 86, alignSelf: "center" }]}>
                <View style={styles.coachRow}>
                  <Icon name="chevronDown" size={22} color="#fff" />
                  <Text style={styles.coachText}>Capture</Text>
                </View>
              </View>

              <View style={[styles.coachHint, { top: 10, right: 10 }]}>
                <View style={styles.coachRow}>
                  <Text style={styles.coachText}>Flip</Text>
                  <Icon name="chevronUp" size={22} color="#fff" />
                </View>
              </View>
            </Animated.View>
          )}
        </Camera>
      </View>

      <View style={styles.paletteRow}>
        <Text style={styles.paletteLabel}>
          {product?.name ? "Try this shade" : "Select a shade"}
        </Text>
        <View style={styles.chipRow}>
          {palette.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorChip,
                { borderColor: selectedColor === c ? "#000" : "#E5E7EB" },
              ]}
              onPress={() => setSelectedColor(c)}
              activeOpacity={0.85}
            >
              <View style={[styles.colorDot, { backgroundColor: c }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={{ width: 80 }} />

        <TouchableOpacity
          style={styles.captureOuter}
          onPress={handleCapture}
          disabled={saving}
          activeOpacity={0.8}
        >
          <View style={styles.captureInner}>
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Icon name="camera" size={20} color="#000" />
            )}
          </View>
        </TouchableOpacity>

        <View style={{ width: 80, alignItems: "flex-end" }}>
          {capturedUri ? (
            <TouchableOpacity
              onPress={() => setCapturedUri(null)}
              style={styles.retakeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.85}
            >
              <Icon name="reset" size={18} color="#E5E7EB" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Modal
        visible={!!capturedUri}
        transparent
        animationType="slide"
        onRequestClose={() => setCapturedUri(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Image source={{ uri: capturedUri || undefined }} style={styles.previewImage} />
            <Text style={styles.previewTitle}>Try-On Captured</Text>
            <Text style={styles.previewSubtitle}>
              Save or share this look. Capture as many variations as you like.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalPrimary]}
                onPress={handleSaveToGallery}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>Save to Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalGhost]}
                onPress={handleShare}
                activeOpacity={0.9}
              >
                <Text style={styles.modalGhostText}>Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closePreview}
              onPress={() => setCapturedUri(null)}
              activeOpacity={0.9}
            >
              <Text style={styles.closePreviewText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ Legal: cosmetic simulation only */}
      <Text style={styles.disclaimer}>
        Cosmetic preview only. OmniTintAI does not diagnose, treat, cure, or prevent any condition.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  centerScreen: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, color: "#E5E7EB", fontSize: 14 },

  permissionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    color: "#D1D5DB",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
  },
  permissionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  permissionBtnText: { fontWeight: "800", fontSize: 14, color: "#000" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  topTitle: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  topIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraWrap: { marginTop: 4, alignItems: "center" },
  camera: {
    width: FRAME_SIZE,
    height: FRAME_SIZE * 1.2,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#111",
  },

  overlayBand: {
    position: "absolute",
    top: FRAME_SIZE * 0.18,
    left: 0,
    right: 0,
    height: FRAME_SIZE * 0.35,
  },

  frameCorners: {
    position: "absolute",
    top: FRAME_SIZE * 0.12,
    left: FRAME_SIZE * 0.08,
    right: FRAME_SIZE * 0.08,
    bottom: FRAME_SIZE * 0.18,
  },
  corner: { position: "absolute", width: 32, height: 32, borderColor: "#F9FAFB" },
  cornerTL: { top: 0, left: 0, borderLeftWidth: 2, borderTopWidth: 2 },
  cornerTR: { top: 0, right: 0, borderRightWidth: 2, borderTopWidth: 2 },
  cornerBL: { bottom: 0, left: 0, borderLeftWidth: 2, borderBottomWidth: 2 },
  cornerBR: { bottom: 0, right: 0, borderRightWidth: 2, borderBottomWidth: 2 },

  coachLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  coachHint: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  coachRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  coachText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  paletteRow: { marginTop: 16, paddingHorizontal: 18 },
  paletteLabel: { color: "#E5E7EB", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  colorChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  colorDot: { width: 22, height: 22, borderRadius: 999, borderWidth: 1, borderColor: "#F9FAFB" },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 12,
  },
  captureOuter: {
    width: 74,
    height: 74,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  retakeText: { fontSize: 13, fontWeight: "700", color: "#E5E7EB" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
  },
  previewImage: { width: "100%", height: 360, borderRadius: 18, backgroundColor: "#111" },
  previewTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 12 },
  previewSubtitle: { fontSize: 13, color: "#4B5563", textAlign: "center", marginTop: 4 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
  modalBtn: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  modalPrimary: { backgroundColor: "#000" },
  modalPrimaryText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  modalGhost: { borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#FFF" },
  modalGhostText: { color: "#111827", fontWeight: "800", fontSize: 14 },
  closePreview: { marginTop: 10 },
  closePreviewText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },

  disclaimer: {
    position: "absolute",
    bottom: 10,
    left: 18,
    right: 18,
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },
});
