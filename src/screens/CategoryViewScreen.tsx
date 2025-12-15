import React from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import FavButton from "../components/FavButton";
import { useThemePro } from "../context/ThemeContext";

type Product = {
  id: string;
  name: string;
  brand?: string;
  tone?: string;
  image: any;                // require(...) or {uri}
  arCompatible?: boolean;
  price?: string;            // optional until API
  affiliateLink?: string;    // optional until API
};

export default function CategoryViewScreen() {
  const nav = useNavigation<any>();
  const { colors, gradients } = useThemePro();
  const route = useRoute<any>();
  const title: string = route.params?.title ?? "Products";
  const products: Product[] = route.params?.products ?? [];

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity onPress={() => nav.navigate("ProductDetailsScreen", { product: item })} activeOpacity={0.8}>
      <View style={[s.rowCard, { backgroundColor: colors.card }]}>
        <Image source={item.image} style={s.rowImage} />
        <View style={{ flex: 1 }}>
          <Text style={[s.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[s.rowBrand, { color: colors.mute }]} numberOfLines={1}>{item.brand || item.tone || "OmniTintAI"}</Text>
        </View>
        <FavButton item={item} size={22} color={colors.heart} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header: gradient orange→accent dynamic */}
      <LinearGradient colors={gradients.brand} style={s.header}>
        <Text style={s.headerTitle}>{title}</Text>
      </LinearGradient>

      <FlatList
        data={products}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 28 }}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 20, alignItems: "center",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#000" },

  rowCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, padding: 10,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 1
  },
  rowImage: { width: 58, height: 58, borderRadius: 12, marginRight: 12, backgroundColor: "#eaeaea" },
  rowName: { fontSize: 16, fontWeight: "700" },
  rowBrand: { fontSize: 13 },
});
