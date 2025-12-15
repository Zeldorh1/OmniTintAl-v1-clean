import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

export default function MenuPro({ navigation }) {
  const [pulseEnabled, setPulseEnabled] = useState(true); // default ON until Settings toggle wired
  const translateX = useRef(new Animated.Value(width * 0.8)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // Load toggle state
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("drawerPulse");
      if (saved !== null) setPulseEnabled(JSON.parse(saved));
    })();
  }, []);

  // Slide-in animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Stronger pulse animation
  useEffect(() => {
    if (!pulseEnabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseEnabled]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width * 0.8,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.goBack());
  };

  const go = (route) => {
    closeDrawer();
    setTimeout(() => navigation.navigate(route), 140);
  };

  const items = [
    { label: "AR Try-On Studio", icon: "color-palette-outline", route: "ARStudio" },
    { label: "360° Preview", icon: "cube-outline", route: "AR360PreviewScreen" },
    { label: "Hair Health Scanner", icon: "heart-outline", route: "HairHealthScannerScreen" },
    { label: "AI Chatbox", icon: "chatbubble-ellipses-outline", route: "AIChatScreen" },
    { label: "Trend Radar", icon: "trending-up-outline", route: "TrendRadarScreen" },
    { label: "Settings", icon: "settings-outline", route: "SettingsScreen" },
  ];

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX }] }]}
      >
        <Text style={styles.title}>OmniTintAI Studio</Text>

        {items.map((item, i) => (
          <Animated.View key={i} style={pulseEnabled && { transform: [{ scale }] }}>
            <Pressable
              onPress={() => go(item.route)}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color="#D4AF37"
                style={[styles.icon, styles.glow]}
              />
              <Text style={styles.label}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.45)" />
            </Pressable>
          </Animated.View>
        ))}

        <Pressable onPress={closeDrawer} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>Close ✕</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, width, height },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.8,
    height,
    backgroundColor: "#fff",
    paddingTop: 56,
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  icon: { marginRight: 12 },
  glow: {
    textShadowColor: "rgba(255,215,0,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  label: { fontSize: 16, color: "#000", fontWeight: "600" },
  closeBtn: {
    marginTop: 26,
    backgroundColor: "#000",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14,
  },
  closeTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
