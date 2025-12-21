// client/src/screens/HomeScreenPro.js
// FLAGSHIP DROP-IN — alive mock imagery + correct Trend Radar gating + legal links
// ✅ Hero cards -> CategoryView
// ✅ Recommended list looks real (high-quality mock images)
// ✅ Trend Radar: canUseLimit on mount, consumeLimit on tap
// ✅ PremiumGate receives { feature, used, limit }
// ✅ Working Terms/Privacy/Affiliate links

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Alert,
  Linking,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import FavButton from "../components/FavButton";
import products from "../data/mockProducts";
import PersonalizationPrompt from "../components/PersonalizationPrompt";
import { useSettings } from "../context/SettingsContext";
import { canUseLimit, consumeLimit } from "../utils/grokHairScannerBundles/userLimits";
import WelcomeOverlay from "../components/WelcomeOverlay";

const TERMS_URL = "https://luxwavelabs.com/terms";
const PRIVACY_URL = "https://luxwavelabs.com/privacy";
const AFFILIATE_URL = "https://luxwavelabs.com/affiliate";

// High-quality “real app” hero imagery (Unsplash)
const HERO_CARDS = [
  {
    id: "seasonal",
    label: "Seasonal",
    tagline: "Fresh picks for right now",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=80&auto=format&fit=crop",
  },
  {
    id: "lights",
    label: "Lights",
    tagline: "Bright blondes & shine",
    image:
      "https://images.unsplash.com/photo-1526045478516-99145907023c?w=1400&q=80&auto=format&fit=crop",
  },
  {
    id: "darkBold",
    label: "Dark & Bold",
    tagline: "Deep tones that pop",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1400&q=80&auto=format&fit=crop",
  },
  {
    id: "trending",
    label: "Trending",
    tagline: "What’s hot globally",
    image:
      "https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=1400&q=80&auto=format&fit=crop",
  },
];

// Fallback “product-like” images so Recommended always looks real
const RECO_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526045405698-cf8b8acc4aaf?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522338140262-f46f5913618f?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585232351009-aa87416fca90?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=1200&q=80&auto=format&fit=crop",
];

export default function HomeScreenPro() {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const isPremium = !!settings?.account?.isPremium;

  const [trendLocked, setTrendLocked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const openUrl = useCallback(async (url) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Link error", "Could not open the link.");
    }
  }, []);

  // ─────────────────────────────────────────────
  // Welcome overlay (once per app version)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const currentVersion =
          Constants?.expoConfig?.version ||
          Constants?.manifest2?.extra?.version ||
          "1.0.0";

        const lastSeen = await AsyncStorage.getItem("welcome_last_seen_version");
        if (lastSeen !== currentVersion) setShowWelcome(true);
      } catch (e) {
        console.warn("[WelcomeOverlay] version check failed:", e);
      }
    };
    checkWelcome();
  }, []);

  const handleWelcomeDismiss = useCallback(
    async (goPremium = false) => {
      try {
        const currentVersion =
          Constants?.expoConfig?.version ||
          Constants?.manifest2?.extra?.version ||
          "1.0.0";

        await AsyncStorage.setItem("welcome_last_seen_version", currentVersion);
      } catch (e) {
        console.warn("[WelcomeOverlay] persist failed:", e);
      }

      setShowWelcome(false);

      if (goPremium) {
        navigation.navigate("Premium", { screen: "PremiumMenu" });
      }
    },
    [navigation]
  );

  // ─────────────────────────────────────────────
  // Trend Radar gating
  // ✅ CHECK only on mount
  // ✅ CONSUME only when user taps
  // ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { allowed } = await canUseLimit("TREND_RADAR", { isPremium });
      setTrendLocked(!allowed);
    })();
  }, [isPremium]);

  const openPremiumGate = useCallback(
    ({ feature, used, limit }) => {
      try {
        navigation.navigate("Premium", {
          screen: "PremiumGate",
          params: { feature, used, limit },
        });
      } catch (e) {
        console.warn("[HomeScreenPro] premium gate route failed", e);
        Alert.alert("Premium Feature", "This feature requires Premium.");
      }
    },
    [navigation]
  );

  const handleTrendRadarPress = useCallback(async () => {
    const res = await consumeLimit("TREND_RADAR", { isPremium });

    if (!res.allowed) {
      openPremiumGate({
        feature: "TREND_RADAR",
        used: res.used,
        limit: res.limit,
      });
      return;
    }

    navigation.navigate("Premium", { screen: "TrendRadar" });
  }, [isPremium, navigation, openPremiumGate]);

  // ─────────────────────────────────────────────
  // Navigation helpers
  // ─────────────────────────────────────────────
  const handleOpenCategory = useCallback(
    (card) => {
      // Your AppNavigator shows: <Stack.Screen name="CategoryView" .../>
      navigation.navigate("CategoryView", {
        section: card.id,
        title: card.label,
      });
    },
    [navigation]
  );

  const handleOpenProduct = useCallback(
    (item) => {
      try {
        // Your root stack shows: <Stack.Screen name="ProductDetails" .../>
        navigation.navigate("ProductDetails", { product: item });
      } catch (e) {
        console.warn("[HomeScreenPro] ProductDetails nav failed", e);
      }
    },
    [navigation]
  );

  // ─────────────────────────────────────────────
  // “Alive” recommended feed: enforce images even if mockProducts is thin
  // ─────────────────────────────────────────────
  const recommended = useMemo(() => {
    const base = Array.isArray(products) ? products : [];
    const picked = base.slice(0, 12);

    return picked.map((p, idx) => ({
      ...p,
      image:
        p?.image ||
        RECO_FALLBACK_IMAGES[idx % RECO_FALLBACK_IMAGES.length],
      brand: p?.brand || "OmniTintAI Select",
      price: p?.price || "Tap to view",
    }));
  }, []);

  const heroCards = useMemo(() => HERO_CARDS, []);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 44 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logoText}>OmniTintAI®</Text>
            <Text style={styles.logoSub}>Intelligent Hair. Intelligent Price.</Text>
          </View>

          <TouchableOpacity
            style={[styles.trendPill, trendLocked && styles.trendPillLocked]}
            onPress={handleTrendRadarPress}
            activeOpacity={0.9}
          >
            <Text style={styles.trendPillText}>
              {trendLocked ? "Unlock Trend Radar" : "Open Trend Radar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero cards */}
        <View style={styles.heroContainer}>
          {heroCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.heroCard}
              activeOpacity={0.92}
              onPress={() => handleOpenCategory(card)}
            >
              <ImageBackground
                source={{ uri: card.image }}
                style={styles.heroImage}
                imageStyle={{ borderRadius: 22 }}
              >
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroLabel}>{card.label}</Text>
                  <Text style={styles.heroTagline}>{card.tagline}</Text>
                  <Text style={styles.heroCta}>Explore →</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommended */}
        <Text style={styles.sectionTitle}>Recommended For You</Text>

        <View style={{ paddingHorizontal: 16 }}>
          {recommended.map((item, i) => (
            <TouchableOpacity
              key={String(item?.id ?? i)}
              style={styles.rowCard}
              activeOpacity={0.92}
              onPress={() => handleOpenProduct(item)}
            >
              {i < 3 && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}

              <Image source={{ uri: item.image }} style={styles.rowImage} />

              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item?.name || item?.title || "Premium Color Pick"}
                </Text>
                <Text style={styles.rowBrand} numberOfLines={1}>
                  {item.brand}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.price}
                </Text>
              </View>

              <FavButton item={item} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Legal links */}
        <View style={styles.legalWrap}>
          <Text style={styles.legalText}>
            By using OmniTintAI, you agree to our{" "}
            <Text style={styles.legalLink} onPress={() => openUrl(TERMS_URL)}>
              Terms
            </Text>{" "}
            and{" "}
            <Text style={styles.legalLink} onPress={() => openUrl(PRIVACY_URL)}>
              Privacy Policy
            </Text>
            .
          </Text>
          <Text style={styles.legalSmall}>
            <Text style={styles.legalLinkSmall} onPress={() => openUrl(AFFILIATE_URL)}>
              Affiliate disclosure
            </Text>
            : As an Amazon Associate, we earn from qualifying purchases.
          </Text>
        </View>

        {/* Personalization nudge */}
        <PersonalizationPrompt />
      </ScrollView>

      {/* Welcome overlay (once per version) */}
      <WelcomeOverlay
        visible={showWelcome}
        onClose={() => handleWelcomeDismiss(false)}
        onUpgrade={() => handleWelcomeDismiss(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },

  topBar: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  logoText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  logoSub: { marginTop: 4, fontSize: 12, color: "#BDBDBD" },

  trendPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  trendPillLocked: { backgroundColor: "#DC2626" },
  trendPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 0.4,
  },

  heroContainer: { paddingHorizontal: 16, marginTop: 14, gap: 12 },
  heroCard: { height: 168, borderRadius: 22, overflow: "hidden" },
  heroImage: { flex: 1, justifyContent: "flex-end" },
  heroOverlay: {
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  heroLabel: { fontSize: 20, fontWeight: "900", color: "#FFF" },
  heroTagline: { marginTop: 3, fontSize: 13, color: "#EAEAEA" },
  heroCta: { marginTop: 10, fontSize: 13, fontWeight: "800", color: "#FFF" },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
    color: "#FFF",
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E1E1E",
    position: "relative",
  },
  newBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  newBadgeText: { color: "#000", fontSize: 10, fontWeight: "900" },

  rowImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: "#222",
  },
  rowName: { fontSize: 16, fontWeight: "900", color: "#FFF" },
  rowBrand: { fontSize: 12, color: "#C7C7C7", marginTop: 2 },
  rowMeta: { fontSize: 12, color: "#8E8E8E", marginTop: 2 },

  legalWrap: { paddingHorizontal: 16, marginTop: 4, marginBottom: 10 },
  legalText: { fontSize: 12, color: "#AFAFAF", lineHeight: 16 },
  legalSmall: { marginTop: 6, fontSize: 11, color: "#8C8C8C" },
  legalLink: { color: "#FFF", fontWeight: "900", textDecorationLine: "underline" },
  legalLinkSmall: { color: "#CFCFCF", textDecorationLine: "underline" },
});
