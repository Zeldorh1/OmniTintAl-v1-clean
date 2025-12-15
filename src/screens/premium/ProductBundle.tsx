// client/src/screens/premium/ProductBundleScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking, // ← ADDED for Amazon links
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSettings } from "../../context/SettingsContext";
import products from "../../data/mockProducts";
import { appendAffiliateTag } from "../../config/affiliate"; // ← CENTRALIZED

type RouteParams = {
  source?: string;
  scan?: any;
  trendItem?: any;
  selectedProduct?: any;
};

export default function ProductBundleScreen() {
  const { settings } = useSettings();
  const isPremium = !!settings?.account?.isPremium;
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params: RouteParams = route?.params || {};
  const { source, scan, trendItem, selectedProduct } = params;

  const contextLine = useMemo(() => {
    if (source === "HairScanner" && scan) {
      return "Built from your latest hair scan so you can fix the real issues first.";
    }
    if (source === "TrendRadar" && trendItem) {
      return `Built around "${trendItem?.name || "today’s top looks"}" so you can ride the trend without frying your hair.`;
    }
    if (source === "ARStudio" && selectedProduct) {
      return "These kits are tuned around the shade you just tried on.";
    }
    return "Three simple kits so you’re not guessing which products belong together.";
  }, [source, scan, trendItem, selectedProduct]);

  const catalog = Array.isArray(products) ? products : [];

  const essentials = catalog.slice(0, 3);
  const repairBoost = catalog.slice(3, 7);
  const proStudio = catalog.slice(7, 12);

  const bundles = [
    {
      id: "essentials",
      label: "Everyday Essentials",
      subtitle: "Core shampoo + conditioner + 1 hero treatment.",
      tone: "Perfect if you just want a solid baseline routine.",
      products: essentials,
      tag: "Best for daily use",
    },
    {
      id: "repair",
      label: "Repair & Protect Boost",
      subtitle: "Damage repair, bond support, and heat protection.",
      tone: "For dry, brittle, color-treated, or heat-styled hair.",
      products: repairBoost,
      tag: "Best for stressed hair",
    },
    {
      id: "pro",
      label: "Pro Studio Finish",
      subtitle: "Gloss, tone control, and long-wear color care.",
      tone: "For people who treat their bathroom like a mini salon.",
      products: proStudio,
      tag: "Best for high-impact results",
    },
  ];

  // FINAL: Open product directly on Amazon with affiliate tag
  const handleOpenProduct = (item: any) => {
    try {
      const amazonUrl = appendAffiliateTag(`https://www.amazon.com/dp/${item.asin}`);
      Linking.openURL(amazonUrl);
    } catch (e) {
      console.warn("[ProductBundleScreen] Amazon link error", e);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Build Your Kit</Text>
          <Text style={s.subtitle}>
            Curated hair care bundles designed to work together.
          </Text>
          <Text style={s.context}>{contextLine}</Text>

          <View style={s.chipRow}>
            <View style={s.chip}>
              <Text style={s.chipText}>Amazon-ready products</Text>
            </View>
            {isPremium && (
              <View style={[s.chip, s.chipPremium]}>
                <Text style={s.chipPremiumText}>AI-boosted picks</Text>
              </View>
            )}
          </View>
        </View>

        {bundles.map((bundle) => (
          <View key={bundle.id} style={s.bundleCard}>
            <View style={s.bundleHeaderRow}>
              <View>
                <Text style={s.bundleLabel}>{bundle.label}</Text>
                <Text style={s.bundleSubtitle}>{bundle.subtitle}</Text>
              </View>
              <View style={s.bundleTag}>
                <Text style={s.bundleTagText}>{bundle.tag}</Text>
              </View>
            </View>

            <Text style={s.bundleTone}>{bundle.tone}</Text>

            <View style={s.productList}>
              {bundle.products.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={s.productRow}
                  activeOpacity={0.9}
                  onPress={() => handleOpenProduct(item)}
                >
                  <Image source={{ uri: item.image }} style={s.productImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={s.productBrand}>
                      {item.brand || "OmniTintAI Match"}
                    </Text>
                  </View>
                  <View style={s.productMeta}>
                    <Text style={s.productMetaText}>View on Amazon →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.ctaRow}>
              <TouchableOpacity
                style={s.ctaPrimary}
                activeOpacity={0.9}
                onPress={() => {
                  navigation.navigate("CompareProductsScreen", {
                    fromBundle: bundle.id,
                  });
                }}
              >
                <Text style={s.ctaPrimaryText}>Compare & Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.ctaGhost}
                activeOpacity={0.9}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={s.ctaGhostText}>Browse more colors</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={s.footerNote}>
          Product details and final pricing will be pulled directly from Amazon
          at checkout for full accuracy and compliance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
  header: { marginBottom: 16, padding: 16, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" },
  title: { fontSize: 24, fontWeight: "900", color: "#000" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#4B5563" },
  context: { marginTop: 8, fontSize: 12, color: "#6B7280" },
  chipRow: { flexDirection: "row", marginTop: 10, gap: 8, flexWrap: "wrap" },
  chip: { borderRadius: 999, backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 11, fontWeight: "700", color: "#374151" },
  chipPremium: { backgroundColor: "#000" },
  chipPremiumText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  bundleCard: { marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  bundleHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bundleLabel: { fontSize: 18, fontWeight: "900", color: "#000" },
  bundleSubtitle: { marginTop: 2, fontSize: 12, color: "#6B7280" },
  bundleTag: { backgroundColor: "#000", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  bundleTagText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  bundleTone: { marginTop: 8, fontSize: 12, color: "#4B5563" },
  productList: { marginTop: 10 },
  productRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  productImage: { width: 52, height: 52, borderRadius: 16, marginRight: 10, backgroundColor: "#E5E7EB" },
  productName: { fontSize: 14, fontWeight: "700", color: "#000" },
  productBrand: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  productMeta: { marginLeft: 8 },
  productMetaText: { fontSize: 11, fontWeight: "600", color: "#111827" },
  ctaRow: { marginTop: 12, flexDirection: "row", gap: 8 },
  ctaPrimary: { flex: 1, borderRadius: 999, backgroundColor: "#000", paddingVertical: 11, alignItems: "center" },
  ctaPrimaryText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  ctaGhost: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: "#111827", paddingVertical: 11, alignItems: "center", backgroundColor: "#FFF" },
  ctaGhostText: { color: "#111827", fontSize: 13, fontWeight: "700" },
  footerNote: { marginTop: 16, fontSize: 11, color: "#6B7280", textAlign: "center" },
});
