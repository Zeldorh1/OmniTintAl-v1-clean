// client/src/screens/premium/CompareProductsScreen.js
// FINAL · PRODUCT COMPARISON · PREMIUM-GATED · NO VECTOR-ICONS · LEGAL
// - Uses PremiumContext (single source of truth)
// - Free users: limited uses
// - Premium: unlimited
// - One-time Pro Tips overlay + functional coach arrows
// - Telemetry stays opt-in

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";

import { API_URL } from "../../config/api";
import { track } from "../../utils/telemetry";

// ✅ Premium SVG icon system (NO FONT FILES)
import { Icon } from "../../components/Icons";

// ✅ One-time tips overlay
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";

// ✅ Gate (single source of truth)
import { usePremium } from "../../context/PremiumContext";

const GUIDE_KEY = "@omnitintai:guide_compare_products_v2";
const FEATURE_KEY = "compare-products";

export default function CompareProductsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hydrated, isPremium, usesLeft, incrementUse, settings } = usePremium();

  // From whoever called us (TrendRadar, HairScanner, Bundles, etc.)
  const params = route.params || {};
  const source = params.source || "Unknown";
  const focusAreas = params.focusAreas || []; // e.g. ["moisture", "repair"]
  const scan = params.scan || null; // optional hair scan summary
  const seedProducts = params.products || null; // optional preselected products

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Tips + coach arrows
  const [showGuide, setShowGuide] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const coachOpacity = useRef(new Animated.Value(0)).current;

  const goGate = useCallback(
    (left) => {
      navigation.replace("PremiumGate", {
        feature: "Product Comparison",
        usesLeft: left,
      });
    },
    [navigation]
  );

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
    }, 3200);
  };

  const fetchComparison = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const body = {
        source,
        focusAreas,
        scan,
        products: seedProducts,
      };

      const res = await fetch(`${API_URL}/compare-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      setComparison(json);

      // Telemetry (opt-in)
      try {
        track(
          "compare_products_loaded",
          {
            source,
            productCount: json?.products?.length || 0,
            headline: json?.headline || null,
          },
          { enabled: !!settings?.shareAnonymizedStats }
        );
      } catch {}
    } catch (e) {
      console.warn("[CompareProductsScreen] fetch error", e);
      setError("Comparison isn’t available right now. Please try again shortly.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [source, focusAreas, scan, seedProducts, settings?.shareAnonymizedStats]);

  // ─────────────────────────────────────────
  // Gate on focus
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

  // Count one use once when user is allowed in (non-premium)
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

  // Initial load + one-time guide
  useEffect(() => {
    (async () => {
      if (!hydrated) return;

      // If locked, do nothing (focus effect will route them)
      if (!isPremium && usesLeft(FEATURE_KEY) <= 0) return;

      await fetchComparison();

      try {
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
      } catch {}
    })();
  }, [hydrated, isPremium, usesLeft, fetchComparison]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComparison();
  }, [fetchComparison]);

  const handleOpenProduct = (item) => {
    try {
      track(
        "compare_products_tap",
        {
          source,
          asin: item.asin || null,
          title: item.name || item.title || null,
        },
        { enabled: !!settings?.shareAnonymizedStats }
      );

      navigation.navigate("ProductDetailsScreen", { product: item });
    } catch (e) {
      console.warn("[CompareProductsScreen] navigation error", e);
    }
  };

  if (!hydrated || loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={s.loadingTxt}>Comparing products for your hair goals…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const products = comparison?.products || [];
  const headline = comparison?.headline || "Best options for your hair goals";
  const summary =
    comparison?.summary ||
    "Here’s how these products stack up for moisture, repair, and frizz control.";
  const criteria = comparison?.criteria || ["Moisture", "Repair", "Frizz control"];
  const winnerAsin = comparison?.winnerAsin || null;

  return (
    <SafeAreaView style={s.container}>
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => {
          setShowGuide(false);
          showCoachMarks();
        }}
        title="Pro tips for product comparison"
        bullets={[
          "Top pick is the best overall match for your focus areas.",
          "Tap any product to open details and try it in AR if supported.",
          "Pull down to refresh for updated recommendations.",
          "Use the criteria chips to understand what was evaluated.",
        ]}
      />

      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.85}
        >
          <Icon name="close" size={18} color="#111827" />
        </TouchableOpacity>

        <Text style={s.topTitle}>Compare products</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.header}>
        <Text style={s.headline}>{headline}</Text>
        <Text style={s.subtitle}>{summary}</Text>

        {focusAreas.length > 0 && (
          <Text style={s.chipRow}>
            Focus: <Text style={s.chipText}>{focusAreas.join(" • ")}</Text>
          </Text>
        )}

        <Text style={s.criteriaLabel}>What we evaluated:</Text>
        <View style={s.criteriaRow}>
          {criteria.map((c) => (
            <View key={c} style={s.criteriaChip}>
              <Text style={s.criteriaText}>{c}</Text>
            </View>
          ))}
        </View>

        {showCoach && (
          <Animated.View style={[s.coachLayer, { opacity: coachOpacity }]} pointerEvents="none">
            <View style={[s.coachPill, { top: 106, left: 16 }]}>
              <View style={s.coachRow}>
                <Icon name="chevronUp" size={20} color="#fff" />
                <Text style={s.coachText}>Criteria</Text>
              </View>
            </View>

            <View style={[s.coachPill, { top: 10, right: 16 }]}>
              <View style={s.coachRow}>
                <Text style={s.coachText}>Pull to refresh</Text>
                <Icon name="chevronDown" size={20} color="#fff" />
              </View>
            </View>

            <View style={[s.coachPill, { bottom: 10, left: 16 }]}>
              <View style={s.coachRow}>
                <Icon name="chevronDown" size={20} color="#fff" />
                <Text style={s.coachText}>Tap a product</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={(item, idx) => item.id?.toString?.() || item.asin || String(idx)}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              No products to compare yet. Try again from Trend Radar or a product page.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isWinner = winnerAsin && item.asin && item.asin === winnerAsin;
          const score = item.score ?? null; // 0–100

          return (
            <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={() => handleOpenProduct(item)}>
              <View style={s.cardLeft}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={s.image} />
                ) : (
                  <View style={[s.image, s.imagePlaceholder]}>
                    <Text style={s.imagePlaceholderText}>Img</Text>
                  </View>
                )}
              </View>

              <View style={s.cardMiddle}>
                <Text style={s.name} numberOfLines={2}>
                  {item.name || item.title}
                </Text>

                {item.brand ? <Text style={s.brand}>{item.brand}</Text> : null}

                {item.bestFor ? (
                  <Text style={s.bestFor} numberOfLines={2}>
                    Best for: {item.bestFor}
                  </Text>
                ) : null}

                {item.pros && item.pros.length > 0 ? (
                  <Text style={s.pros} numberOfLines={2}>
                    ✅ {item.pros[0]}
                  </Text>
                ) : null}
              </View>

              <View style={s.cardRight}>
                {score != null ? (
                  <View style={s.scorePill}>
                    <Text style={s.scoreValue}>{Math.round(score)}</Text>
                    <Text style={s.scoreLabel}>/100</Text>
                  </View>
                ) : null}

                {isWinner ? (
                  <View style={s.winnerTag}>
                    <Text style={s.winnerText}>Top pick</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          error ? (
            <View style={s.footerError}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null
        }
      />

      {/* ✅ Legal: recommendation disclaimer */}
      <Text style={s.disclaimer}>
        Recommendations are informational only and may not work the same for everyone. Patch test and follow product instructions.
      </Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  topTitle: { fontSize: 18, fontWeight: "800", color: "#000" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  headline: { fontSize: 20, fontWeight: "900", color: "#000" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#4B5563" },
  chipRow: { marginTop: 6, fontSize: 12, color: "#6B7280" },
  chipText: { fontWeight: "700", color: "#111827" },
  criteriaLabel: { marginTop: 10, fontSize: 12, color: "#6B7280" },
  criteriaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  criteriaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  criteriaText: { fontSize: 11, color: "#111827", fontWeight: "600" },

  coachLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.06)" },
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
  coachText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 42 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: { marginRight: 10 },
  image: { width: 64, height: 64, borderRadius: 14, backgroundColor: "#E5E7EB" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { fontSize: 12, color: "#6B7280" },

  cardMiddle: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#000" },
  brand: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  bestFor: { fontSize: 12, color: "#4B5563", marginTop: 4 },
  pros: { fontSize: 11, color: "#059669", marginTop: 4 },

  cardRight: { alignItems: "flex-end", justifyContent: "flex-start", marginLeft: 8 },
  scorePill: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#000",
  },
  scoreValue: { fontSize: 16, fontWeight: "900", color: "#FFF" },
  scoreLabel: { fontSize: 11, color: "#E5E7EB", marginLeft: 2 },

  winnerTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FBBF24",
  },
  winnerText: { fontSize: 10, fontWeight: "800", color: "#111827" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingTxt: { marginTop: 12, fontSize: 14, color: "#4B5563" },

  empty: { paddingVertical: 40, alignItems: "center", paddingHorizontal: 20 },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  footerError: { marginTop: 10, paddingHorizontal: 16 },
  errorText: { fontSize: 12, color: "#B91C1C", textAlign: "center" },

  disclaimer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 10,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 15,
  },
});
