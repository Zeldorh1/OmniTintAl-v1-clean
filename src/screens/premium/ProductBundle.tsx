// client/src/screens/premium/ProductBundleScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSettings } from "../../context/SettingsContext";
import products from "../../data/mockProducts";
import { appendAffiliateTag } from "../../config/affiliate";
import { buildMultiAsinCartUrl } from "../../utils/amazonCart";

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
    if (source === "HairScanner" && scan)
      return "Built from your latest hair scan so you can fix the real issues first.";
    if (source === "TrendRadar" && trendItem)
      return `Built around "${trendItem?.name || "today’s top looks"}" so you can ride the trend without frying your hair.`;
    if (source === "ARStudio" && selectedProduct)
      return "These kits are tuned around the shade you just tried on.";
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

  const handleOpenProduct = (item: any) => {
    const amazonUrl = appendAffiliateTag(`https://www.amazon.com/dp/${item.asin}`);
    Linking.openURL(amazonUrl);
  };

  const handleCheckoutBundle = (bundle: any) => {
    const cartUrl = buildMultiAsinCartUrl(
      bundle.products.map((p: any) => ({ asin: p.asin }))
    );
    if (cartUrl) Linking.openURL(cartUrl);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent}>
        
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Build Your Kit</Text>
          <Text style={s.subtitle}>Curated hair-care bundles that work together.</Text>
          <Text style={s.context}>{contextLine}</Text>

          <View style={s.chipRow}>
            <View style={s.chip}><Text style={s.chipText}>Amazon-ready products</Text></View>
            {isPremium && (
              <View style={[s.chip, s.chipPremium]}>
                <Text style={s.chipPremiumText}>AI-Boosted Picks</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bundles */}
        {bundles.map((bundle) => (
          <View key={bundle.id} style={s.bundleCard}>

            <View style={s.bundleHeaderRow}>
              <View>
                <Text style={s.bundleLabel}>{bundle.label}</Text>
                <Text style={s.bundleSubtitle}>{bundle.subtitle}</Text>
              </View>
              <View style={s.bundleTag}><Text style={s.bundleTagText}>{bundle.tag}</Text></View>
            </View>

            <Text style={s.bundleTone}>{bundle.tone}</Text>

            {/* Products */}
            <View style={s.productList}>
              {bundle.products.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={s.productRow}
                  onPress={() => handleOpenProduct(item)}
                >
                  <Image source={{ uri: item.image }} style={s.productImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
                    <Text style={s.productBrand}>{item.brand || "OmniTintAI Match"}</Text>
                    <Text style={s.pricePlaceholder}>Check price on Amazon ↗</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* CTAs */}
            <View style={s.ctaRow}>
              <TouchableOpacity
                style={s.ctaPrimary}
                onPress={() => handleCheckoutBundle(bundle)}
              >
                <Text style={s.ctaPrimaryText}>Checkout Whole Bundle →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.ctaGhost}
                onPress={() => navigation.navigate("CompareProductsScreen", { fromBundle: bundle.id })}
              >
                <Text style={s.ctaGhostText}>Compare & Shop</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={s.footerNote}>
          Product details & pricing are always fetched directly on Amazon during checkout.
        </Text>

        <Text style={s.poweredBy}>Powered by Amazon</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:"#FAFAFA"},
  scrollContent:{padding:16,paddingBottom:40},

  header:{padding:16,backgroundColor:"#FFF",borderRadius:20,borderColor:"#E5E7EB",borderWidth:1,marginBottom:14},
  title:{fontSize:24,fontWeight:"900",color:"#000"},
  subtitle:{fontSize:13,color:"#4B5563",marginTop:4},
  context:{fontSize:12,color:"#6B7280",marginTop:6},

  chipRow:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:10},
  chip:{backgroundColor:"#F3F4F6",paddingHorizontal:10,paddingVertical:5,borderRadius:999},
  chipText:{fontSize:11,fontWeight:"700",color:"#374151"},
  chipPremium:{backgroundColor:"#000"},
  chipPremiumText:{fontSize:11,fontWeight:"700",color:"#FFF"},

  bundleCard:{backgroundColor:"#FFF",borderRadius:22,padding:16,borderColor:"#E5E7EB",borderWidth:1,marginTop:14,elevation:2},

  bundleHeaderRow:{flexDirection:"row",justifyContent:"space-between"},
  bundleLabel:{fontSize:18,fontWeight:"900",color:"#000"},
  bundleSubtitle:{fontSize:12,color:"#6B7280"},
  bundleTone:{fontSize:12,color:"#4B5563",marginTop:6},
  bundleTag:{backgroundColor:"#000",borderRadius:999,paddingHorizontal:10,paddingVertical:5,marginTop:2},
  bundleTagText:{color:"#FFF",fontSize:11,fontWeight:"700"},

  productList:{marginTop:10},
  productRow:{flexDirection:"row",alignItems:"center",marginBottom:10},
  productImage:{width:52,height:52,borderRadius:16,marginRight:10,backgroundColor:"#E5E7EB"},
  productName:{fontSize:14,fontWeight:"700",color:"#000"},
  productBrand:{fontSize:11,color:"#6B7280"},
  pricePlaceholder:{fontSize:11,color:"#9CA3AF",marginTop:2}, // Safe placeholder

  ctaRow:{flexDirection:"row",marginTop:12,gap:8},
  ctaPrimary:{flex:1,backgroundColor:"#000",borderRadius:999,paddingVertical:11,alignItems:"center"},
  ctaPrimaryText:{color:"#FFF",fontWeight:"800"},
  ctaGhost:{flex:1,borderRadius:999,paddingVertical:11,alignItems:"center",borderWidth:1,borderColor:"#111"},
  ctaGhostText:{color:"#111",fontWeight:"700"},

  footerNote:{fontSize:11,color:"#6B7280",textAlign:"center",marginTop:16},
  poweredBy:{fontSize:10,textAlign:"center",color:"#9CA3AF",marginTop:6},
});
