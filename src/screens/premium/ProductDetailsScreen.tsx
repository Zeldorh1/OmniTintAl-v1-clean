// client/src/screens/ProductDetailsScreen.tsx
// V1 · PRODUCT DETAILS · AR + OMNITINTAI BAG + AMAZON AFFILIATE
//
// - Shows single product details (from Home/search/AR picks)
// - "Try It On" → ARStudioMainV2 (when arCompatible)
// - "Add to Bag" → saves to @omnitintai:bag (CartScreen multi-ASIN checkout)
// - Fallback: opens affiliateLink on Amazon if no ASIN
// - Amazon affiliate disclosure (required)
// - Hero image loading state

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import FavButton from "../components/FavButton";
import { useThemePro } from "../context/ThemeContext";
import AddToBagButton, {
  AddToBagItem,
} from "../components/AddToBagButton";

export default function ProductDetailsScreen() {
  const nav = useNavigation<any>();
  const { colors } = useThemePro();
  const { params } = useRoute<any>();
  const product = params?.product;

  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    // If this is a local require() image, don't show spinner forever
    if (product && typeof product.image === "number") {
      setImageLoading(false);
    }
  }, [product]);

  if (!product) {
    return (
      <View
        style={[
          s.container,
          {
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text style={{ color: colors.text }}>No product selected.</Text>
      </View>
    );
  }

  const onTry = () => nav.navigate("ARStudioMainV2", { product });

  // Fallback direct-to-Amazon open (used only when we *can't* bag it)
  const onOpenAmazon = async () => {
    if (product.affiliateLink) {
      try {
        await Linking.openURL(product.affiliateLink);
      } catch {
        Alert.alert("Error", "Could not open the product page on Amazon.");
      }
    } else {
      Alert.alert(
        "Coming Soon",
        "Cart integration will activate once the API keys are connected."
      );
    }
  };

  // Map current product → bag item (only if we have an ASIN)
  const bagItem: AddToBagItem | null =
    product && product.asin
      ? {
          asin: String(product.asin),
          title: product.name,
          // If you have a URL field, use it; otherwise leave undefined
          image:
            typeof product.image === "string" ? product.image : undefined,
          price: product.price || undefined,
          brand: product.brand || undefined,
          tags: Array.isArray(product.tags) ? product.tags : [],
        }
      : null;

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Hero image + loading state */}
      <View style={s.heroWrap}>
        {typeof product.image === "number" ? (
          // local require() image
          <Image source={product.image} style={s.hero} />
        ) : (
          <Image
            source={{ uri: product.image }}
            style={s.hero}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        )}

        {imageLoading && (
          <View style={s.heroOverlay}>
            <ActivityIndicator size="large" color="#999" />
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>
              {product.name}
            </Text>
            {!!product.tone && (
              <Text style={[s.tone, { color: colors.mute }]}>
                {product.tone}
              </Text>
            )}
          </View>
          <FavButton item={product} size={24} color={colors.heart} />
        </View>

        {!!product.price && (
          <>
            <Text style={[s.price, { color: colors.text }]}>
              {product.price}
            </Text>
            <Text style={[s.priceNote, { color: colors.mute }]}>
              Price and availability may change on Amazon.
            </Text>
          </>
        )}

        {!!product.brand && (
          <Text style={[s.brand, { color: colors.mute }]}>
            {product.brand}
          </Text>
        )}

        {!!product.description && (
          <>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              Description
            </Text>
            <Text style={[s.desc, { color: colors.text }]}>
              {product.description}
            </Text>
          </>
        )}

        <View style={s.btnRow}>
          {product.arCompatible && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.text }]}
              onPress={onTry}
              activeOpacity={0.9}
            >
              <Text style={[s.btnText, { color: colors.background }]}>
                Try It On
              </Text>
            </TouchableOpacity>
          )}

          {bagItem ? (
            <AddToBagButton
              item={bagItem}
              variant="outline"
              fullWidth={!product.arCompatible}
              // optional: you could toast here via onAdded
            />
          ) : (
            // Fallback if we don't have an ASIN yet
            <TouchableOpacity
              style={[s.btn, { borderWidth: 1, borderColor: colors.text }]}
              onPress={onOpenAmazon}
              activeOpacity={0.9}
            >
              <Text style={[s.btnText, { color: colors.text }]}>
                Shop on Amazon
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Amazon affiliate disclosure */}
        <Text style={[s.disclaimer, { color: colors.mute }]}>
          Items you add to your OmniTintAI bag are purchased securely through
          Amazon. Final pricing, shipping, and fulfillment are handled by
          Amazon. As an Amazon Associate, OmniTintAI earns from qualifying
          purchases.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  heroWrap: {
    width: "100%",
    height: 360,
    backgroundColor: "#eaeaea",
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: "800" },
  tone: { marginTop: 2, fontSize: 13 },

  price: { marginTop: 8, fontSize: 18, fontWeight: "800" },
  priceNote: { fontSize: 11, marginTop: 2 },

  brand: { marginTop: 4, marginBottom: 8, fontSize: 13 },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "800",
  },
  desc: { lineHeight: 20, fontSize: 14 },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  btnText: { fontWeight: "800" },

  disclaimer: {
    marginTop: 16,
    fontSize: 11,
    lineHeight: 16,
  },
});
