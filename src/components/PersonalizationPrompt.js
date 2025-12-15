// client/src/components/PersonalizationPrompt.js
import React, { useRef, useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemePro } from "../context/ThemeContext";
import { Icon } from "./Icons"; // ✅ local icon system (no @expo/vector-icons)

export default function PersonalizationPrompt() {
  const navigation = useNavigation();
  const { colors, gradients } = useThemePro();
  const [visible, setVisible] = useState(true);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 750, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => navigation.navigate("PersonalizationSurvey")}
        onLongPress={() => setVisible(false)}
        style={styles.iconWrap}
        android_ripple={{ color: "#00000010", borderless: true }}
      >
        <LinearGradient
          colors={[colors.accent, gradients?.brand?.[1] || colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Replace Ionicons("brush") with your local icon */}
        <Icon name="sparkles" size={20} color={colors.contrast || "#fff"} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 46,
    right: 22,
    zIndex: 99,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
