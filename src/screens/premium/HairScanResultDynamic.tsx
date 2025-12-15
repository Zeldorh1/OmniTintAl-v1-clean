// client/src/screens/premium/HairScanResultScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

// ✅ One-time tips overlay
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";

type HairScan = {
  dryness: number;
  damage: number;
  frizz: number;
  oiliness: number;
  breakageRisk: number;
  notes: string[];
  focus: string[];
  suggestedCategories: string[];
  aiSummary: string;
  aiPlan: { title: string; text: string }[];
};

type RouteParams = {
  scan: HairScan;
};

const GUIDE_KEY = "@omnitintai:guide_hair_scan_result_v2";

export default function HairScanResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scan: HairScan = route.params?.scan;

  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
      } catch {}
    })();
  }, []);

  const openTips = useCallback(() => setShowGuide(true), []);

  const metrics = useMemo(() => {
    if (!scan) return [];
    return [
      { key: "dryness", label: "Dryness", value: scan.dryness },
      { key: "damage", label: "Damage", value: scan.damage },
      { key: "frizz", label: "Frizz", value: scan.frizz },
      { key: "oiliness", label: "Oiliness", value: scan.oiliness },
      { key: "breakageRisk", label: "Breakage Risk", value: scan.breakageRisk },
    ] as const;
  }, [scan]);

  const meterWidth = (v: number) => `${Math.min(10, Math.max(0, v)) * 10}%`;

  if (!scan) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.error}>No scan data found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* One-time Pro Tips */}
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        title="Pro tips for Hair Scan Results"
        bullets={[
          "These scores are risk indicators (0–10), not a diagnosis or medical result.",
          "Focus chips show the fastest wins—start there before chasing everything at once.",
          "Use Smart Bundles for a complete routine; use Trending Shades if you’re planning a color change.",
          "Re-scan under similar lighting for cleaner progress comparisons.",
        ]}
      />

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={s.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Your Hair Health Scan</Text>
            <Text style={s.subtitle}>
              Based on your photo, here’s where your hair needs the most attention.
            </Text>
          </View>

          {/* Tiny “re-open tips” link (optional, professional) */}
          <TouchableOpacity onPress={openTips} style={s.tipsBtn} activeOpacity={0.85}>
            <Text style={s.tipsBtnText}>Pro tips</Text>
          </TouchableOpacity>
        </View>

        {/* Focus chips */}
        {scan.focus?.length > 0 && (
          <View style={s.chipRow}>
            {scan.focus.map((f) => (
              <View key={f} style={s.chip}>
                <Text style={s.chipText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Metrics */}
        <View style={s.card}>
          {metrics.map((m) => (
            <View key={m.key} style={s.metricRow}>
              <View style={s.metricLabelRow}>
                <Text style={s.metricLabel}>{m.label}</Text>
                <Text style={s.metricValue}>{m.value.toFixed(1)}/10</Text>
              </View>
              <View style={s.meterBg}>
                <View style={[s.meterFill, { width: meterWidth(m.value) }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>AI Summary</Text>
          <Text style={s.body}>{scan.aiSummary}</Text>
        </View>

        {/* Notes */}
        {scan.notes?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>What we noticed</Text>
            {scan.notes.map((n, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.body}>{n}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Plan */}
        {scan.aiPlan?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Your 4-week game plan</Text>
            {scan.aiPlan.map((step, i) => (
              <View key={i} style={s.stepBlock}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.body}>{step.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggested categories */}
        {scan.suggestedCategories?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>What to shop for</Text>
            <View style={s.chipRow}>
              {scan.suggestedCategories.map((c) => (
                <View key={c} style={s.chipOutline}>
                  <Text style={s.chipOutlineText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTAs */}
        <View style={s.ctaRow}>
          <TouchableOpacity
            style={[s.ctaBtn, s.ctaPrimary]}
            onPress={() =>
              navigation.navigate("ProductBundleScreen", {
                source: "HairScanner",
              })
            }
            activeOpacity={0.9}
          >
            <Text style={s.ctaPrimaryText}>View Smart Bundles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.ctaBtn, s.ctaSecondary]}
            onPress={() => navigation.navigate("TrendRadarScreen", { source: "HairScanner" })}
            activeOpacity={0.9}
          >
            <Text style={s.ctaSecondaryText}>See Trending Shades</Text>
          </TouchableOpacity>
        </View>

        {/* Optional: ultra-minimal disclaimer line (non-invasive) */}
        <Text style={s.microDisclaimer}>
          Not medical advice. OmniTintAI provides informational estimates only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { padding: 18, paddingBottom: 32 },

  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },

  title: { fontSize: 24, fontWeight: "900", color: "#000", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6B7280" },

  tipsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  tipsBtnText: { fontSize: 12, fontWeight: "800", color: "#111" },

  error: { padding: 20, fontSize: 16, color: "#DC2626" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  chip: {
    backgroundColor: "#111",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#000", marginBottom: 8 },
  body: { fontSize: 13, color: "#4B5563" },

  metricRow: { marginBottom: 10 },
  metricLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metricLabel: { fontSize: 13, fontWeight: "700", color: "#111" },
  metricValue: { fontSize: 12, color: "#6B7280" },
  meterBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#111",
  },

  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { fontSize: 14, marginRight: 6, color: "#4B5563" },

  stepBlock: { marginTop: 8 },
  stepTitle: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 2 },

  chipOutline: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  chipOutlineText: { fontSize: 11, color: "#111", fontWeight: "600" },

  ctaRow: { flexDirection: "row", marginTop: 8, gap: 10 },
  ctaBtn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  ctaPrimary: { backgroundColor: "#000" },
  ctaPrimaryText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  ctaSecondary: { borderWidth: 1, borderColor: "#111", backgroundColor: "#FFF" },
  ctaSecondaryText: { color: "#111", fontSize: 13, fontWeight: "700" },

  microDisclaimer: {
    marginTop: 12,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
