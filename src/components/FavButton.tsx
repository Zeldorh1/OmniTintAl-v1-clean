// client/src/components/FavButton.js
import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { useFavs } from "../context/FavoritesContext";
import { Icon } from "./Icons"; // ✅ your local icon system (no vector-icons)

export default function FavButton({ item, size = 22, color = "#000" }) {
  const favs = useFavs?.() || {};

  const id = useMemo(() => item?.id ?? item?.asin ?? item?.name ?? "unknown", [item]);
  const isFav =
    typeof favs.isFavorite === "function" ? favs.isFavorite(id) : false;

  const toggle = () => {
    if (typeof favs.toggle === "function") favs.toggle(item);
    else if (typeof favs.add === "function" && !isFav) favs.add(item);
    else if (typeof favs.remove === "function" && isFav) favs.remove(id);
  };

  // If your Icons.tsx uses stroke instead of fill, it will still look fine.
  return (
    <Pressable onPress={toggle} hitSlop={10}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Icon name={isFav ? "heart" : "heartOff"} size={size} color={color} />
      </View>
    </Pressable>
  );
}
