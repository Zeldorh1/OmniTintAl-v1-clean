// client/src/screens/premium/HairScannerScreen.tsx
// FINAL · HAIR HEALTH SCANNER · PREMIUM-GATED · NO VECTOR-ICONS · LEGAL
// - Uses PremiumContext (single source of truth)
// - Free users: limited scans (uses decrement on scan attempt)
// - Premium: unlimited
// - One-time Pro Tips overlay
// - Short consent before accessing camera/photos

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

import { API_URL } from "../../config/api";
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";
import { usePremium } from "../../context/PremiumContext";

const GUIDE_KEY = "@omnitintai:guide_hair_scanner_v2";
const FEATURE_KEY = "hair-scanner"; // make sure this exists in PremiumContext defaults

export default function HairScannerScreen() {
  const navigation = useNavigation<any>();
  const { hydrated, isPremium, usesLeft, incrementUse } = usePremium();

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

  // Hard gate on focus
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;

      if (!isPremium) {
        const left = usesLeft(FEATURE_KEY);
        if (left <= 0) {
          navigation.replace("PremiumGate", {
            feature: "Hair Health Scanner",
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
        "OmniTintAI provides informational estimates only — not medical advice. By continuing, you confirm you have permission to use this photo.",
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
        feature: "Hair Health Scanner",
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
            Alert.alert("Camera blocked", "Please enable camera access in settings.");
            return;
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            setBusy(false);
            Alert.alert("Photos blocked", "Please enable photo library access in settings.");
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

        // Backend
        const res = await fetch(`${API_URL}/hair-scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!res.ok) throw new Error(`Scan failed: HTTP ${res.status}`);

        const json = await res.json();
        setBusy(false);

        // ✅ Match your PremiumNavigator: "HairScanResultDynamic"
        navigation.navigate("HairScanResultDynamic", { scan: json });
      } catch (e) {
        console.warn("[HairScannerScreen] error", e);
        setBusy(false);
        Alert.alert(
          "Scan failed",
          "Something went wrong reading this photo. Try a clear, well-lit hair photo."
        );
      }
    },
    [hydrated, busy, navigation, isPremium, usesLeft, incrementUse]
  );

  const left = hydrated ? usesLeft(FEATURE_KEY) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        title="Pro tips for Hair Health Scanner"
        bullets={[
          "Use bright, natural light (near a window). Avoid colored LEDs.",
          "Show mid-lengths + ends. Roots alone can hide dryness and breakage.",
          "Remove heavy filters/tints—natural color gives the best read.",
          "If your hair is wet, towel-dry first for more consistent results.",
        ]}
      />

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Hair Health Scanner</Text>
            <Text style={styles.subtitle}>
              Scan your hair to get a personalized repair + care plan in seconds.
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
          <Text style={styles.stepLine}>• Show mids and ends, not just roots</Text>
          <Text style={styles.stepLine}>• Avoid heavy filters or strong color tints</Text>
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

        {!isPremium && (
          <Text style={styles.freeHint}>
            Free users get {Math.max(0, left)} scans. Upgrade to unlock unlimited scanning and deeper
            reports.
          </Text>
        )}

        <Text style={styles.microDisclaimer}>Informational estimates only — not medical advice.</Text>
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

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },

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

  btnSecondary: { borderWidth: 1, borderColor: "#111", backgroundColor: "#FFF" },
  btnSecondaryText: { color: "#111", fontSize: 14, fontWeight: "700" },

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
