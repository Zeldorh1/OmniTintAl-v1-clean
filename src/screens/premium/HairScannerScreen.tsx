// client/src/screens/premium/HairScannerScreen.tsx
// FINAL · V1 · HAIR SCANNER · GEMINI VISION + AUTHENTICITY/TIMING GATE
//
// - Calls Cloudflare gemini-lite worker /scan-hair
// - Sends x-user-id + x-tier for guardRequest
// - Free users: limited scans via PremiumContext
// - Premium: unlimited
// - One-time Pro Tips overlay + legal consent
// - Rejects duplicate / low-auth / “too fast color change” scans
// - All language framed as cosmetic / informational, NOT medical

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import FeatureGuideOverlay, {
  hasSeenGuide,
} from "../../components/FeatureGuideOverlay";
import { usePremium } from "../../context/PremiumContext";
import { useAuth } from "../../context/AuthContext";

const GUIDE_KEY = "@omnitintai:guide_hair_scanner_v2";
const FEATURE_KEY = "hair-scanner"; // must exist in PremiumContext defaults

// Direct Gemini hair scan worker endpoint
const GEMINI_SCAN_URL =
  "https://gemini-lite.withered-sound-1f6b.workers.dev/scan-hair";

export default function HairScannerScreen() {
  const navigation = useNavigation<any>();
  const { hydrated, isPremium, usesLeft, incrementUse } = usePremium();
  const { user } = useAuth(); // used for x-user-id header

  const [busy, setBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // One-time tips (only when hydrated + allowed)
  useEffect(() => {
    (async () => {
      if (!hydrated) return;

      // If not premium and already hard-gated, don’t show tips here
      if (!isPremium && usesLeft(FEATURE_KEY) <= 0) return;

      try {
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
      } catch {
        // ignore
      }
    })();
  }, [hydrated, isPremium, usesLeft]);

  // Hard gate on focus (routes to PremiumGate if out of uses)
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;

      if (!isPremium) {
        const left = usesLeft(FEATURE_KEY);
        if (left <= 0) {
          navigation.replace("PremiumGate", {
            feature: "Hair Scanner",
            usesLeft: left,
          });
          return;
        }
      }
    }, [hydrated, isPremium, usesLeft, navigation])
  );

  const requestConsent = () =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        "Before you scan",
        "OmniTintAI provides cosmetic, informational estimates only — not medical advice or diagnosis. By continuing, you confirm this is your own photo (or you have permission to use it) and that you understand results are approximate.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Continue", onPress: () => resolve(true) },
        ]
      );
    });

  const ensureAllowedAndCountUse = async () => {
    if (isPremium) return true;

    const left = usesLeft(FEATURE_KEY);
    if (left <= 0) {
      navigation.navigate("PremiumGate", {
        feature: "Hair Scanner",
        usesLeft: left,
      });
      return false;
    }

    // Count a use when the user actually proceeds to scan
    await incrementUse(FEATURE_KEY);
    return true;
  };

  const runScan = useCallback(
    async (source: "camera" | "library") => {
      try {
        if (!hydrated || busy) return;

        const consent = await requestConsent();
        if (!consent) return;

        const ok = await ensureAllowedAndCountUse();
        if (!ok) return;

        setBusy(true);

        // Permissions
        if (source === "camera") {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            setBusy(false);
            Alert.alert(
              "Camera blocked",
              "Please enable camera access in your device settings to use the Hair Scanner."
            );
            return;
          }
        } else {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            setBusy(false);
            Alert.alert(
              "Photos blocked",
              "Please enable photo library access in your device settings to use the Hair Scanner."
            );
            return;
          }
        }

        // Launch picker
        const pickerResult =
          source === "camera"
            ? await ImagePicker.launchCameraAsync({
                base64: true,
                quality: 0.8,
              })
            : await ImagePicker.launchImageLibraryAsync({
                base64: true,
                quality: 0.8,
              });

        if (pickerResult.canceled || !pickerResult.assets?.[0]?.base64) {
          setBusy(false);
          return;
        }

        const base64 = pickerResult.assets[0].base64;
        const tierHeader = isPremium ? "premium" : "free";
        const uid = user?.uid ?? "anon-device";

        // ------------- Call gemini-lite /scan-hair -------------
        const res = await fetch(GEMINI_SCAN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid, // used by guardRequest
            "x-tier": tierHeader,
          },
          body: JSON.stringify({
            imageBase64: base64,
          }),
        });

        if (!res.ok) {
          setBusy(false);
          Alert.alert(
            "Scan unavailable",
            "We couldn’t complete this scan right now. This might be a temporary issue or limit. Please try again later with a clear, well-lit hair photo."
          );
          return;
        }

        const json = await res.json();
        setBusy(false);

        // Expect: { ok, model, scan, authenticity, timing, ... }
        if (!json?.ok || !json?.scan) {
          Alert.alert(
            "Scan not usable",
            "We couldn’t interpret this photo as a clear hair image. Try again with a well-lit, close-up photo of your hair only."
          );
          return;
        }

        const auth = json.authenticity || {};
        const timing = json.timing || {};

        const score = Number(auth.score ?? 0);
        const duplicate = !!auth.duplicate;
        const tooFastColorChange = !!timing.tooFastColorChange;

        // 🔐 Gate 1: duplicates
        if (duplicate) {
          Alert.alert(
            "Scan not used",
            "This photo looks like a repeat of an earlier scan. For clean tracking and rewards, please use a new, fresh photo."
          );
          return;
        }

        // 🔐 Gate 2: unrealistic “instant color change”
        if (tooFastColorChange) {
          const mins =
            typeof timing.minutesSinceLast === "number"
              ? timing.minutesSinceLast
              : null;

          Alert.alert(
            "Scan not counted",
            mins !== null
              ? `We detected a major hair color shift in about ${mins} minutes. For accurate tracking and fairness, we only count real, gradual color changes — not rapid or repeated tests. Please scan again after an actual color change over time.`
              : "We detected an unrealistic hair color change in a very short window. For accurate tracking and fairness, only real, gradual changes are counted."
          );
          return;
        }

        // 🔐 Gate 3: low authenticity
        if (score < 0.5) {
          Alert.alert(
            "Scan not usable",
            "This image doesn’t look like a clear, original hair photo. Avoid screenshots, AI images, or pictures of a screen. Try again with a well-lit, close-up shot of your real hair."
          );
          return;
        }

        // ✅ Only clean, unique, time-consistent scans reach the brain/UI
        navigation.navigate("HairScanResultDynamic", {
          scan: json.scan,
          authenticity: auth,
          timing,
        });
      } catch (e) {
        console.warn("[HairScannerScreen] error", e);
        setBusy(false);
        Alert.alert(
          "Scan failed",
          "Something went wrong reading this photo. Try a clear, well-lit photo that focuses on your hair only. Results are cosmetic estimates, not medical advice."
        );
      }
    },
    [hydrated, busy, navigation, isPremium, usesLeft, incrementUse, user]
  );

  const left = hydrated ? usesLeft(FEATURE_KEY) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        title="Pro tips for Hair Scanner"
        bullets={[
          "Use bright, natural light (near a window). Avoid colored LEDs.",
          "Show mid-lengths and ends, not just roots or scalp alone.",
          "Avoid heavy filters or strong color tints from apps or lighting.",
          "If your hair is wet, towel-dry first for more consistent readings.",
        ]}
      />

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Hair Scanner</Text>
            <Text style={styles.subtitle}>
              Get a cosmetic snapshot of how your hair is doing and ideas for
              care — based on a single photo.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowGuide(true)}
            style={styles.tipsBtn}
            activeOpacity={0.85}
            disabled={!hydrated}
          >
            <Text style={styles.tipsBtnText}>Pro tips</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.steps}>
          <Text style={styles.stepLine}>• Use a clear, well-lit photo</Text>
          <Text style={styles.stepLine}>
            • Show mids and ends, not just roots
          </Text>
          <Text style={styles.stepLine}>
            • Avoid filters or photos of a screen
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => runScan("camera")}
          disabled={!hydrated || busy}
          activeOpacity={0.9}
        >
          {busy ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnPrimaryText}>Scan With Camera</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => runScan("library")}
          disabled={!hydrated || busy}
          activeOpacity={0.9}
        >
          <Text style={styles.btnSecondaryText}>Upload From Gallery</Text>
        </TouchableOpacity>

        {busy && (
          <Text style={styles.scanningText}>Analyzing your hair…</Text>
        )}

        {!isPremium && (
          <Text style={styles.freeHint}>
            Free users get {Math.max(0, left)} scans. Upgrade to unlock
            unlimited scanning and deeper, AI-generated breakdowns.
          </Text>
        )}

        <Text style={styles.microDisclaimer}>
          OmniTintAI provides cosmetic, informational estimates only — not
          medical advice, diagnosis, or treatment. Always consult a
          professional for medical or scalp concerns.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  tipsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  tipsBtnText: { fontSize: 12, fontWeight: "800", color: "#111" },
  title: { fontSize: 24, fontWeight: "900", color: "#000", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#4B5563" },
  steps: { marginBottom: 18 },
  stepLine: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  btn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  btnPrimary: { backgroundColor: "#000" },
  btnPrimaryText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  btnSecondary: {
    borderWidth: 1,
    borderColor: "#111",
    backgroundColor: "#FFF",
  },
  btnSecondaryText: { color: "#111", fontSize: 14, fontWeight: "700" },
  scanningText: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
  freeHint: {
    marginTop: 10,
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
  microDisclaimer: {
    marginTop: 10,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
