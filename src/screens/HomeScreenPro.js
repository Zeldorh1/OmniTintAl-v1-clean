// client/src/screens/HomeScreenPro.js
// FLAGSHIP DROP-IN (stable routes + premium gate safe + hero cards -> CategoryViewScreen)
// ✅ No SeasonalResults
// ✅ Hero cards are entry points to CategoryViewScreen (section + title)
// ✅ Trend Radar gate routes through Premium stack
// ✅ Works even if PremiumGate is only inside PremiumNavigator

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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import FavButton from "../components/FavButton";
import products from "../data/mockProducts";
import PersonalizationPrompt from "../components/PersonalizationPrompt";
import { useSettings } from "../context/SettingsContext";
import { checkLimit } from "../utils/grokHairScannerBundles/userLimits";
import WelcomeOverlay from "../components/WelcomeOverlay";

export default function HomeScreenPro() {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const isPremium = !!settings?.account?.isPremium;

  const [trendLocked, setTrendLocked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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
  // Trend Radar gate state
  // ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { allowed } = await checkLimit("TREND_RADAR", { isPremium });
      setTrendLocked(!allowed);
    })();
  }, [isPremium]);

  const openPremiumGate = useCallback(
    ({ feature, usesLeft }) => {
      // Prefer Premium stack (where your PremiumGate lives)
      try {
        navigation.navigate("Premium", {
          screen: "PremiumGate",
          params: { feature, usesLeft },
        });
      } catch (e) {
        console.warn("[HomeScreenPro] premium gate route failed", e);
        Alert.alert("Premium Feature", "This feature requires Premium.");
      }
    },
    [navigation]
  );

  const handleTrendRadarPress = useCallback(async () => {
    const { allowed, limit } = await checkLimit("TREND_RADAR", { isPremium });
    if (!allowed) {
      openPremiumGate({ feature: "Trend Radar", usesLeft: limit || 3 });
      return;
    }

    // TrendRadar is in PremiumNavigator as "TrendRadar" in your screenshot
    navigation.navigate("Premium", { screen: "TrendRadar" });
  }, [isPremium, navigation, openPremiumGate]);

  const handleOpenProduct = useCallback(
    (item) => {
      try {
        navigation.navigate("ProductDetailsScreen", { product: item });
      } catch (e) {
        console.warn("[HomeScreenPro] ProductDetailsScreen nav failed", e);
      }
    },
    [navigation]
  );

  // ─────────────────────────────────────────────
  // Hero cards = CATEGORY entry points (locked in)
  // section ids map to your future Amazon “sections”
  // ─────────────────────────────────────────────
  const heroCards = useMemo(
    () => [
      {
        id: "seasonal",
        label: "Seasonal",
        tagline: "Season-ready shades and refresh picks",
        image:
          "https://images.unsplash.com/photo-1602293589930-4cad2638e4c8?w=800&q=80",
      },
      {
        id: "lights",
        label: "Lights",
        tagline: "Bright blondes, highlights & shine",
        image:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
      },
      {
        id: "darkBold",
        label: "Dark & Bold",
        tagline: "Deep tones, high-impact color",
        image:
          "https://images.unsplash.com/photo-1595470690052-1dc61c62e10c?w=800&q=80",
      },
      {
        id: "trending",
        label: "Trending",
        tagline: "What’s hot right now (updates often)",
        image:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
      },
    ],
    []
  );

  const handleOpenCategory = useCallback(
    (card) => {
      // CategoryViewScreen.tsx should accept: route.params.section, route.params.title
      navigation.navigate("CategoryView", {
        section: card.id,
        title: card.label,
      });
    },
    [navigation]
  );

  const recommended = useMemo(() => products.slice(0, 12), []);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

        {/* Brand */}
        <View style={styles.logoBar}>
          <Text style={styles.logoText}>OmniTintAI</Text>
          <Text style={styles.logoSub}>Hair • Color • Care</Text>
        </View>

        {/* Header + Trend Radar */}
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
              {trendLocked ? "Unlock Trend Radar" : "Open Trend Radar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero cards (CATEGORY entry points) */}
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

        {/* Recommended list (stays below hero cards) */}
        <Text style={styles.sectionTitle}>Recommended For You</Text>
        <View style={{ paddingHorizontal: 16 }}>
          {recommended.map((item, i) => (
            <TouchableOpacity
              key={String(item?.id ?? i)}
              style={styles.rowCard}
              activeOpacity={0.9}
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
                  {item.name}
                </Text>
                <Text style={styles.rowBrand} numberOfLines={1}>
                  OmniTintAI Pro Formula
                </Text>
              </View>

              <FavButton item={item} />
            </TouchableOpacity>
          ))}
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
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  logoBar: { paddingTop: 16, paddingHorizontal: 18, paddingBottom: 4 },
  logoText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#000",
    letterSpacing: -0.5,
  },
  logoSub: { marginTop: 2, fontSize: 12, color: "#6B7280" },

  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontSize: 24, fontWeight: "900", color: "#000" },
  subtitle: { marginTop: 3, fontSize: 12, color: "#6B7280" },

  trendPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  trendPillLocked: { backgroundColor: "#DC2626" },
  trendPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },

  heroContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    gap: 12,
  },
  heroCard: { height: 170, borderRadius: 24, overflow: "hidden" },
  heroImage: { flex: 1, borderRadius: 24, justifyContent: "flex-end" },
  heroOverlay: {
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroLabel: { fontSize: 20, fontWeight: "800", color: "#FFF" },
  heroTagline: { marginTop: 2, fontSize: 13, color: "#E5E7EB" },
  heroCta: { marginTop: 8, fontSize: 13, fontWeight: "700", color: "#FFF" },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
    color: "#000",
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  newBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  newBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },

  rowImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 14,
    backgroundColor: "#E5E7EB",
  },
  rowName: { fontSize: 17, fontWeight: "700", color: "#000" },
  rowBrand: { fontSize: 13, color: "#777", marginTop: 2 },
});
