import React, { useState } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemePro } from "../context/ThemeContext";
import { useApp } from "../context/AppContext.pro";
import products from "../data/mockProducts"; // expects an array with {name, tone, image}
import PersonalizationPrompt from "../components/PersonalizationPrompt";
import Ionicons from "@expo/vector-icons/Ionicons";
export default function HomeScreenPro() {
  const { colors, gradients } = useThemePro();
  const { subscription } = useApp();
  const isPremium = subscription?.premium;

  const hero = products.slice(0, 4);
  const recommended = products.slice(0, 10);

  const [favs, setFavs] = useState(new Set());
  const toggleFav = (name) =>
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 36 }}>
      {/* Header */}
      <LinearGradient colors={gradients.brand} style={styles.header}>
        <Text style={[styles.title, { color: colors.contrast }]}>Trending Dyes</Text>
        <Text style={[styles.subtitle, { color: colors.contrast, opacity: 0.9 }]}>
          {isPremium ? "Premium Access Unlocked" : "Free Preview Mode"}
        </Text>
      </LinearGradient>
<Ionicons name="home" size={22} color="#000" />
      {/* Hero Cards */}
      <View style={styles.grid}>
        {hero.map((item, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.card }]}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.tone, { color: colors.mute }]}>{item.tone}</Text>
          </View>
        ))}
      </View>

      {/* Recommended Shades */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Shades</Text>
      <View style={{ paddingHorizontal: 14 }}>
        {recommended.map((item, i) => {
          const on = favs.has(item.name);
          return (
            <View key={i} style={[styles.rowCard, { backgroundColor: colors.card }]}>
              <Image source={{ uri: item.image }} style={styles.rowImage} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.rowBrand, { color: colors.mute }]}>OmniTintAI</Text>
              </View>
              <Pressable onPress={() => toggleFav(item.name)} style={{ paddingHorizontal: 6 }}>
                <Text style={{ fontSize: 20 }}>{on ? "💛" : "🤍"}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* subtle top-right brush prompt (optional & auto-hides) */}
      <PersonalizationPrompt />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 24, alignItems: "center", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { marginTop: 4, fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", paddingHorizontal: 10, marginTop: 10 },
  card: { width: "45%", borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, marginBottom: 16, overflow: "hidden", alignItems: "center" },
  image: { width: "100%", height: 120, backgroundColor: "#eaeaea" },
  name: { fontSize: 16, fontWeight: "700", marginTop: 6 },
  tone: { fontSize: 13, marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginTop: 8, marginBottom: 8, paddingHorizontal: 14 },
  rowCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  rowImage: { width: 58, height: 58, borderRadius: 12, marginRight: 12, backgroundColor: "#eaeaea" },
  rowName: { fontSize: 16, fontWeight: "700" },
  rowBrand: { fontSize: 13 },
});
