// client/src/components/FavButton.js
import React, { useRef } from "react";
import { Pressable, Animated, View } from "react-native";
import { useFavs } from "../context/FavoritesContext";
import { Icon } from "./Icons";

export default function FavButton({
  item,
  size = 24,
  color = "#111",
  onToggle,
}: {
  item: any;
  size?: number;
  color?: string;
  onToggle?: (item: any, isFav: boolean) => void;
}) {
  const favs = useFavs?.() || {};

  const id = item?.id ?? item?.asin ?? item?.name ?? "unknown";
  const isFav = typeof favs.isFavorite === "function" ? favs.isFavorite(id) : false;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const toggle = () => {
    const nextFav = !isFav;
    if (typeof favs.toggle === "function") favs.toggle(item);
    else if (typeof favs.add === "function" && nextFav) favs.add(item);
    else if (typeof favs.remove === "function" && !nextFav) favs.remove(id);

    // Million-dollar subtle bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle?.(item, nextFav);
  };

  return (
    <Pressable onPress={toggle} hitSlop={12}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon
          name={isFav ? "heart" : "heart-off"} // ← FIXED: use Lucide's "heart-off" (hyphen)
          size={size}
          color={isFav ? "#DC2626" : color} // red when favorited
          strokeWidth={isFav ? 0 : 2} // filled vs outline
        />
      </Animated.View>
    </Pressable>
  );
}
