// client/src/screens/HomeScreenPro.js
// V1 FLAGSHIP — Home Screen (REMOTE-IMAGE SAFE DROP-IN)
// - No local require() assets
// - Uses stable remote image URLs (picsum with fixed seeds)
// - Fixes recSectionRef usage
// - Keeps your existing flows: personalization + recommended + premium gating

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import FavButton from "../components/FavButton";
import PersonalizationPrompt from "../components/PersonalizationPrompt";
import WelcomeOverlay from "../components/WelcomeOverlay";

import products from "../data/mockProducts";
import { useSettings } from "../context/SettingsContext";

import { getPersonalization, consumeJustSavedFlag } from "../utils/personalizationStore";
import { getRecommendedProducts } from "../utils/recommendationEngine";
import { canUseLimit, consumeLimit } from "../utils/grokHairScannerBundles/userLimits";

// ─────────────────────────────────────────────────────────────
// Stable remote image helpers
// ─────────────────────────────────────────────────────────────

// Fixed-size endpoints reduce layout jank.
// Using `seed=` makes images stable across builds/devices.
const HERO_IMG = (seed) => `https://picsum.photos/seed/${seed}/1200/700`;
const PROD_IMG = (seed) => `https://picsum.photos/seed/${seed}/512/512`;

// Hero images (stable seeds)
const heroCardsSeeded = [
  { id: "seasonal", label: "Seasonal", tagline: "Fresh seasonal picks", seed: "omni-seasonal" },
  { id: "lights", label: "Lights", tagline: "Bright blondes & glows", seed: "omni-lights" },
  { id: "darkBold", label: "Dark & Bold", tagline: "Deep tones, high impact", seed: "omni-darkbold" },
  { id: "trending", label: "Trending", tagline: "Popular right now", seed: "omni-trending" },
];

// Normalizes a product image to a valid React Native Image source:
// - if `p.image` is a URL string -> { uri }
// - if missing -> stable fallback URL -> { uri }
// - if already a require() number -> use it directly
function normalizeImageSource(img, fallbackUrl) {
  if (typeof img === "string" && img.length > 0) return { uri: img };
  if (typeof img === "number") return img; // require(...)
  return { uri: fallbackUrl };
}

export default function HomeScreenPro() {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const isPremium = !!settings?.account?.isPremium;

  const scrollRef = useRef(null);

  // Store the Y offset of the Recommended section here (number, not a view ref)
  const recYRef = useRef(0);

  const [trendLocked, setTrendLocked] = useState(false);
  const [trendUsesLeft, setTrendUsesLeft] = useState(0);

  const [showWelcome, setShowWelcome] = useState(false);
  const [prefs, setPrefs] = useState(null);

  const [recommended, setRecommended] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);

  // Aha animation (“Recommendations updated”)
  const ahaOpacity = useRef(new Animated.Value(0)).current;
  const ahaTranslate = useRef(new Animated.Value(12)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;

  // First launch welcome (V1: always show once; you can gate with AsyncStorage later)
  useEffect(() => {
    setShowWelcome(true);
  }, []);

  const heroCards = useMemo(() => {
    return heroCardsSeeded.map((c) => ({
      ...c,
      image: { uri: HERO_IMG(c.seed) },
    }));
  }, []);

  // Hydrate catalog with stable remote fallbacks
  const hydratedCatalog = useMemo(() => {
    const base = Array.isArray(products) ? products : [];
    return base.map((p, idx) => {
      const stableFallback = PROD_IMG(`omni-prod-${idx + 1}`);
      const imageSource = normalizeImageSource(p?.image, stableFallback);

      const tags =
        Array.isArray(p?.tags) && p.tags.length
          ? p.tags
          : ["repair", "shine", "color-safe", "hydration"].slice(0, (idx % 4) + 1);

      return {
        ...p,
        // Ensure we always have a stable id (some mocks might not)
        id: p?.id ?? p?.asin ?? `mock-${idx + 1}`,
        image: imageSource,
        tags,
        name: p?.name ?? p?.title ?? "OmniTintAI Pick",
      };
    });
  }, []);

  const reloadPersonalizationAndRecs = useCallback(async () => {
    setIsLoadingRecs(true);

    try {
      const p = await getPersonalization();
      setPrefs(p || null);

      const next = getRecommendedProducts({
        products: hydratedCatalog,
        prefs: p || null,
        limit: 12,
      });

      // Nice fade swap
      Animated.timing(listOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setRecommended(next);
        Animated.timing(listOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });

      // If personalization was just saved, show “updated” toast + auto-scroll
      const justSaved = await consumeJustSavedFlag();
      if (justSaved) {
        ahaOpacity.setValue(0);
        ahaTranslate.setValue(12);

        Animated.parallel([
          Animated.timing(ahaOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(ahaTranslate, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(ahaOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
              Animated.timing(ahaTranslate, { toValue: 12, duration: 250, useNativeDriver: true }),
            ]).start(() => {
              // Scroll near the Recommended section
              scrollRef.current?.scrollTo?.({
                y: Math.max(0, (recYRef.current || 0) - 80),
                animated: true,
              });
            });
          }, 1000);
        });
      }
    } catch (e) {
      console.warn("[HomeScreenPro] reload failed", e);
      setRecommended(hydratedCatalog.slice(0, 12));
    } finally {
      setIsLoadingRecs(false);
    }
  }, [hydratedCatalog, listOpacity, ahaOpacity, ahaTranslate]);

  useFocusEffect(
    useCallback(() => {
      reloadPersonalizationAndRecs();
    }, [reloadPersonalizationAndRecs])
  );

  // Trend Radar gating
  useEffect(() => {
    (async () => {
      if (isPremium) {
        setTrendLocked(false);
        setTrendUsesLeft(0);
        return;
      }
      try {
        const res = await canUseLimit("TREND_RADAR");
        setTrendLocked(!res?.allowed);
        setTrendUsesLeft(res?.remaining ?? 0);
      } catch {
        setTrendLocked(true);
        setTrendUsesLeft(0);
      }
    })();
  }, [isPremium]);

  const handleTrendRadarPress = useCallback(async () => {
    if (isPremium) {
      navigation.navigate("Premium", { screen: "TrendRadar" });
      return;
    }
    try {
      const check = await canUseLimit("TREND_RADAR");
      if (!check?.allowed) {
        navigation.navigate("Premium", {
          screen: "PremiumGate",
          params: { feature: "Trend Radar", usesLeft: check?.remaining ?? 0 },
        });
        return;
      }
      await consumeLimit("TREND_RADAR");
      navigation.navigate("Premium", { screen: "TrendRadar" });
    } catch {
      Alert.alert("Trend Radar", "Could not open right now.");
    }
  }, [isPremium, navigation]);

  const handleOpenCategory = useCallback(
    (card) => {
      navigation.navigate("CategoryView", { section: card.id, title: card.label });
    },
    [navigation]
  );

  const handleOpenProduct = useCallback(
    (item) => {
      navigation.navigate("ProductDetails", { product: item });
    },
    [navigation]
  );

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

        {/* Logo */}
        <View style={styles.logoBar}>
          <Text style={styles.logoText}>OmniTintAI</Text>
          <Text style={styles.logoSub}>
            Hair • Color • Care {prefs?.primaryGoal ? ` • ${humanGoal(prefs.primaryGoal)}` : ""}
          </Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Trending Right Now</Text>
            <Text style={styles.subtitle}>Powered by Global Trend Radar</Text>
          </View>

          <TouchableOpacity
            style={[styles.trendPill, trendLocked && styles.trendPillLocked]}
            onPress={handleTrendRadarPress}
            activeOpacity={0.9}
          >
            <Text style={styles.trendPillText}>
              {trendLocked ? `Unlock Trend Radar (${trendUsesLeft} free)` : "Open Trend Radar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Cards */}
        <View style={styles.heroContainer}>
          {heroCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.heroCard}
              onPress={() => handleOpenCategory(card)}
              activeOpacity={0.92}
            >
              <ImageBackground
                source={card.image}
                style={styles.heroImage}
                imageStyle={{ borderRadius: 24 }}
              >
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroLabel}>{card.label}</Text>
                  <Text style={styles.heroTagline}>{card.tagline}</Text>
                  <Text style={styles.heroCta}>View dyes →</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommended Section */}
        <View
          onLayout={(e) => {
            recYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Recommended For You</Text>
        </View>

        {isLoadingRecs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.loadingText}>Curating your picks...</Text>
          </View>
        ) : prefs ? (
          <Animated.View style={{ opacity: listOpacity, paddingHorizontal: 16 }}>
            {recommended.map((item, i) => (
              <TouchableOpacity
                key={String(item?.id ?? i)}
                style={styles.rowCard}
                onPress={() => handleOpenProduct(item)}
                activeOpacity={0.92}
              >
                {i < 3 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}

                {/* IMPORTANT: item.image is already a valid Image source */}
                <Image source={item.image} style={styles.rowImage} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name || "OmniTintAI Pick"}
                  </Text>
                  <Text style={styles.rowBrand} numberOfLines={1}>
                    {subtitleFromTags(item?.tags)}
                  </Text>
                </View>

                <FavButton item={item} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Personalize OmniTintAI to get better picks</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("PersonalizationSurvey")}
              activeOpacity={0.92}
            >
              <Text style={styles.emptyButtonText}>Set Preferences</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating personalization prompt */}
      <PersonalizationPrompt longPressHint="Long press to dismiss" />

      {/* Welcome overlay */}
      <WelcomeOverlay
        visible={showWelcome}
        onClose={() => setShowWelcome(false)}
        onUpgrade={() => navigation.navigate("PremiumMenu")}
      />

      {/* Tiny toast */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ahaToast,
          { opacity: ahaOpacity, transform: [{ translateY: ahaTranslate }] },
        ]}
      >
        <Text style={styles.ahaText}>Recommendations updated ✨</Text>
      </Animated.View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function humanGoal(goal) {
  const map = {
    repair: "Repair",
    growth: "Growth",
    color_protection: "Color",
    frizz_control: "Anti-Frizz",
    shine: "Shine",
    maintenance: "Low-Maint",
    volume: "Volume",
  };
  return map[goal] || "Personalized";
}

function subtitleFromTags(tags) {
  const t = Array.isArray(tags) ? tags.map((x) => String(x).toLowerCase()) : [];
  if (t.includes("repair") || t.includes("bond")) return "Repair • Bond Support";
  if (t.includes("color-safe") || t.includes("color")) return "Color Safe • Vibrant";
  if (t.includes("hydration") || t.includes("moisture")) return "Hydration • Shine";
  if (t.includes("growth") || t.includes("scalp")) return "Scalp • Growth";
  return "OmniTintAI Pro Pick";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  logoBar: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 10 },
  logoText: { fontSize: 30, fontWeight: "900", color: "#000", letterSpacing: -0.8 },
  logoSub: { marginTop: 4, fontSize: 14, color: "#6B7280", fontWeight: "500" },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: "900", color: "#000" },
  subtitle: { marginTop: 4, fontSize: 14, color: "#6B7280" },

  trendPill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  trendPillLocked: { backgroundColor: "#DC2626" },
  trendPillText: { fontSize: 14, fontWeight: "800", color: "#FFF" },

  heroContainer: { paddingHorizontal: 16, marginTop: 16, gap: 12 },
  heroCard: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  heroImage: { flex: 1, justifyContent: "flex-end" },
  heroOverlay: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroLabel: { fontSize: 24, fontWeight: "800", color: "#FFF" },
  heroTagline: { marginTop: 6, fontSize: 15, color: "#E5E7EB" },
  heroCta: { marginTop: 12, fontSize: 15, fontWeight: "700", color: "#FFF" },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
    color: "#000",
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  newBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  newBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },

  rowImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: 16,
    backgroundColor: "#E5E7EB",
  },
  rowName: { fontSize: 18, fontWeight: "700", color: "#000" },
  rowBrand: { fontSize: 14, color: "#666", marginTop: 4 },

  loadingContainer: { alignItems: "center", padding: 60 },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },

  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: { fontSize: 16, color: "#333", marginBottom: 16, textAlign: "center" },
  emptyButton: { backgroundColor: "#000", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  emptyButtonText: { color: "#FFF", fontWeight: "800", fontSize: 14 },

  ahaToast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  ahaText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
});
