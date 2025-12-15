import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useThemePro } from "../context/ThemeContext";
import FavButton from "./FavButton";

type FavoriteCardProps = {
  item: {
    id?: string;
    name?: string;
    brand?: string;
    tone?: string;
    image?: any;
    description?: string;
  };
  onPress?: () => void;
};

export default function FavoriteCard({ item, onPress }: FavoriteCardProps) {
  const { colors } = useThemePro();
  if (!item) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.card, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
    >
      {item.image ? (
        <Image source={item.image} style={s.thumb} />
      ) : (
        <View style={[s.thumb, { backgroundColor: "#eaeaea" }]} />
      )}

      <View style={{ flex: 1 }}>
        <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>
          {item.name || "Unnamed Product"}
        </Text>
        <Text style={[s.sub, { color: colors.mute }]} numberOfLines={1}>
          {item.brand || item.tone || "OmniTintAI"}
        </Text>
      </View>

      <FavButton item={item} size={22} color={colors.heart} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  name: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12 },
});
