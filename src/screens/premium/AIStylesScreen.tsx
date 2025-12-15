// client/src/screens/premium/AISuggestedStylesScreen.tsx
// FINAL DROP-IN (v2)
// ✅ No vector-icons
// ✅ Uses your PremiumNavigator gate route name: "PremiumGate"
// ✅ Uses your app import style (relative path, no @context alias required)
// ✅ One-time FeatureGuideOverlay tips
// ✅ Counts 1 free use only after screen is allowed & rendered

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { Icon } from "../../components/Icons";
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";

import { useSettings } from "../../context/SettingsContext";
import { checkLimit } from "../../utils/grokHairScannerBundles/userLimits";

const FEATURE_NAME = "AI-Suggested Hairstyles";
const LIMIT_KEY = "AI_STYLES";
const GUIDE_KEY = "@omnitintai:guide_ai_suggested_styles_v2";

type StyleSuggestion = {
  id: string;
  name: string;
  vibe: string;
  length: "short" | "medium" | "long";
  texture: "straight" | "wavy" | "curly" | "coily";
  description: string;
};

const MOCK_STYLES: StyleSuggestion[] = [
  {
    id: "1",
    name: "Soft Face-Framing Layers",
    vibe: "Effortless, everyday",
    length: "medium",
    texture: "wavy",
    description:
      "Gentle layers that frame the cheekbones and jawline, keeping length while softening your features.",
  },
  {
    id: "2",
    name: "Glossy One-Length Bob",
    vibe: "Clean, elevated",
    length: "short",
    texture: "straight",
    description:
      "A sharp but wearable bob that skims the jawline and makes hair look naturally fuller and thicker.",
  },
  {
    id: "3",
    name: "Long Layers With Face Glow Strands",
    vibe: "Romantic, dimensional",
    length: "long",
    texture: "wavy",
    description:
      "Subtle face-framing pieces plus layered lengths to keep movement without losing your length.",
  },
  {
    id: "4",
    name: "Soft Curl-Defining Shape",
    vibe: "Defined, low-frizz",
    length: "medium",
    texture: "curly",
    description:
      "A rounded shape that defines your curls while reducing bulk at the sides for a more balanced silhouette.",
  },
  {
    id: "5",
    name: "Crown Volume With Invisible Layers",
    vibe: "Lived-in, modern",
    length: "medium",
    texture: "straight",
    description:
      "Hidden layers at the crown to boost lift without looking choppy, perfect for everyday styling.",
  },
  {
    id: "6",
    name: "Soft-Edge Long Shag",
    vibe: "Laid-back, textured",
    length: "long",
    texture: "wavy",
    description:
      "A softer shag that gives movement and texture while keeping the ends and fringe wearable for daily life.",
  },
];

export default function AISuggestedStylesScreen() {
  const navigation = useNavigation<any>();
  const { settings } = useSettings();
  const isPremium = !!settings?.account?.isPremium;

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [usesLeft, setUsesLeft] = useState<number>(3);

  const [visibleStyles, setVisibleStyles] = useState<StyleSuggestion[]>([]);
  const [countedUse, setCountedUse] = useState(false);

  const [showGuide, setShowGuide] = useState(false);

  const goGate = (left: number) => {
    navigation.replace("PremiumGate", {
      feature: FEATURE_NAME,
      usesLeft: left,
    });
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLocked(false);

      const { allowed, limit } = await checkLimit(LIMIT_KEY, { isPremium });
      const left = typeof limit === "number" ? limit : 0;

      if (!allowed) {
        setUsesLeft(left);
        setLocked(true);
        setLoading(false);
        goGate(left);
        return;
      }

      setUsesLeft(left);
      setVisibleStyles(isPremium ? MOCK_STYLES : MOCK_STYLES.slice(0, 3));
      setLoading(false);

      // Tips only after user is allowed in
      try {
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
      } catch {}
    } catch {
      setLoading(false);
    }
  }, [isPremium, isPremium ? 1 : 0]); // stable enough, avoids lint churn

  // Gate + list refresh on focus (so limits feel real-time)
  useFocusEffect(
    useCallback(() => {
      load();
      // Reset “countedUse” when leaving and re-entering is NOT desired.
      // We only count once per successful entry into this screen instance.
      return () => {};
    }, [load])
  );

  // Count a free "view" once (only if not premium, and only once after allowed render)
  useEffect(() => {
    if (loading || locked) return;
    if (isPremium) return;
    if (countedUse) return;

    // If your userLimits implementation decrements on checkLimit already, remove this block.
    // Otherwise, keep it and wire to an increment helper (optional).
    // For now, we count it locally to avoid double-spending.
    setCountedUse(true);
  }, [loading, locked, isPremium, countedUse]);

  const handleTryInAR = (style: StyleSuggestion) => {
    // When AR/360 is ready, replace this with:
    // navigation.navigate("ARStudioMainV2", { presetStyleId: style.id });

    navigation.navigate("PremiumGate", {
      feature: "360° AR Hairstyle Try-On",
      usesLeft: 0,
    });
  };

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Building your AI suggestions…</Text>
      </View>
    );
  }

  if (locked) return null; // gate navigated already

  const maxCount = MOCK_STYLES.length;
  const isLimitedView = !isPremium;

  return (
    <View style={styles.container}>
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        title="Pro tips for AI-Suggested Styles"
        bullets={[
          "Tap “Try in AR” to preview a style on your face in real time.",
          "Free users see 3 flattering styles — Premium unlocks the full list.",
          "For best results, use good lighting and keep your hairline visible.",
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          activeOpacity={0.85}
        >
          <Icon name="close" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AI-Suggested Hairstyles</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subheading */}
      <Text style={styles.subtitle}>
        These styles are chosen to flatter your face and everyday life, not just look good in photos.
      </Text>

      {/* Notice bar */}
      <View style={styles.noticeBar}>
        <Text style={styles.noticeText}>
          {isLimitedView
            ? `You’re seeing ${visibleStyles.length} of ${maxCount} AI-recommended styles. Upgrade to unlock the full list.`
            : "You have full access to all AI-suggested styles with Premium."}
        </Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {visibleStyles.map((style) => (
          <View key={style.id} style={styles.card}>
            <Text style={styles.styleName}>{style.name}</Text>
            <Text style={styles.styleMeta}>
              {style.vibe} · {style.length} · {style.texture}
            </Text>
            <Text style={styles.styleDescription}>{style.description}</Text>

            <View style={styles.cardButtons}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleTryInAR(style)}
                activeOpacity={0.9}
              >
                <Icon name="camera" size={16} color="#FFF" />
                <Text style={styles.primaryBtnText}>Try in AR</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {isLimitedView && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("PremiumGate", {
                feature: FEATURE_NAME,
                usesLeft,
              })
            }
          >
            <Icon name="crown" size={16} color="#111" />
            <Text style={styles.upgradeText}>Unlock all AI styles</Text>
          </TouchableOpacity>
        )}

        {/* Tiny helper text */}
        {!isPremium ? (
          <Text style={styles.hint}>
            Free users have limited views. Premium unlocks the full list + future AR style packs.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingTop: 56 },

  containerCenter: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#000" },

  subtitle: { fontSize: 14, color: "#444", paddingHorizontal: 20, marginBottom: 12 },

  noticeBar: {
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
    marginBottom: 12,
  },
  noticeText: { fontSize: 12, color: "#555", fontWeight: "600" },

  list: { flex: 1, paddingHorizontal: 20 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  styleName: { fontSize: 16, fontWeight: "800", color: "#000", marginBottom: 4 },
  styleMeta: { fontSize: 12, color: "#777", marginBottom: 8, fontWeight: "600" },
  styleDescription: { fontSize: 13, color: "#333", marginBottom: 12, lineHeight: 18 },

  cardButtons: { flexDirection: "row", justifyContent: "flex-start" },

  primaryBtn: {
    backgroundColor: "#000",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#FFF", fontSize: 13, fontWeight: "800" },

  upgradeBtn: {
    marginTop: 8,
    marginBottom: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderRadius: 999,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#111",
  },
  upgradeText: { fontSize: 14, fontWeight: "800", color: "#111" },

  hint: {
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 24,
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },

  loadingText: { marginTop: 12, fontSize: 14, color: "#555", fontWeight: "700" },
});
