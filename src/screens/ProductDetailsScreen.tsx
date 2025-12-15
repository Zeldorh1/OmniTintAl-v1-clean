import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import FavButton from "../components/FavButton";
import { useThemePro } from "../context/ThemeContext";

export default function ProductDetailsScreen() {
  const nav = useNavigation<any>();
  const { colors } = useThemePro();
  const { params } = useRoute<any>();
  const product = params?.product;

  if (!product) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, alignItems:"center", justifyContent:"center" }]}>
        <Text style={{ color: colors.text }}>No product selected.</Text>
      </View>
    );
  }

  const onTry = () => nav.navigate("ARStudioMainV2", { product });
  const onAddToBag = async () => {
    if (product.affiliateLink) {
      try { await Linking.openURL(product.affiliateLink); }
      catch { Alert.alert("Error", "Could not open product page."); }
    } else {
      Alert.alert("Coming Soon", "Cart integration will activate once the API keys are connected.");
    }
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 24 }}>
      <Image source={product.image} style={s.hero} />

      <View style={{ paddingHorizontal: 16 }}>
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>{product.name}</Text>
            {!!product.tone && <Text style={[s.tone, { color: colors.mute }]}>{product.tone}</Text>}
          </View>
          <FavButton item={product} size={24} color={colors.heart} />
        </View>

        {!!product.price && <Text style={[s.price, { color: colors.text }]}>{product.price}</Text>}
        {!!product.brand && <Text style={[s.brand, { color: colors.mute }]}>{product.brand}</Text>}

        {!!product.description && (
          <>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[s.desc, { color: colors.text }]}>{product.description}</Text>
          </>
        )}

        <View style={s.btnRow}>
          {product.arCompatible && (
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.text }]} onPress={onTry}>
              <Text style={[s.btnText, { color: colors.background }]}>Try It On</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.btn, { borderWidth: 1, borderColor: colors.text }]} onPress={onAddToBag}>
            <Text style={[s.btnText, { color: colors.text }]}>Add to Bag</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: "100%", height: 360, backgroundColor: "#eaeaea" },
  titleRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800" },
  tone: { marginTop: 2, fontSize: 13 },
  price: { marginTop: 8, fontSize: 18, fontWeight: "800" },
  brand: { marginTop: 4, marginBottom: 8, fontSize: 13 },
  sectionTitle: { marginTop: 16, marginBottom: 6, fontSize: 16, fontWeight: "800" },
  desc: { lineHeight: 20, fontSize: 14 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  btnText: { fontWeight: "800" },
});
