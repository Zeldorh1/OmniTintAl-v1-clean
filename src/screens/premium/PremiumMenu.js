// client/src/screens/premium/PremiumMenu.js
// FINAL · PREMIUM HAMBURGER MENU · 68% WIDTH · NO FONT ICONS

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "../../components/Icons";

const { width } = Dimensions.get("window");
const MENU_WIDTH = Math.min(width * 0.68, 420);

export default function PremiumMenu() {
  const nav = useNavigation();
  const translateX = useRef(new Animated.Value(MENU_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: MENU_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      // ✅ If we're in a stack, goBack.
      // ✅ If we're on the Menu tab with nowhere to goBack, hop to Home tab.
      const canGoBack = nav?.canGoBack?.() === true;
      if (canGoBack) nav.goBack();
      else nav.getParent()?.navigate?.("Home");
    });
  };

  const go = (route) => {
    close();
    setTimeout(() => nav.navigate(route), 140);
  };

  const Item = ({ label, route, image, icon }) => (
    <Pressable
      onPress={() => go(route)}
      style={({ pressed }) => [
        s.item,
        pressed && Platform.OS === "ios" && { opacity: 0.9 },
      ]}
    >
      <View style={s.left}>
        <View style={s.iconWrap}>
          {image ? <Image source={image} style={s.iconImg} /> : <Icon name={icon} size={18} color="#111" />}
        </View>
        <Text style={s.label}>{label}</Text>
      </View>
      <Icon name="chevronRight" size={16} color="#999" />
    </Pressable>
  );

  return (
    <View style={s.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <Animated.View style={[s.backdrop, { opacity: backdrop }]} />
      </Pressable>

      <Animated.View style={[s.drawer, { transform: [{ translateX }] }]}>
        <Text style={s.title}>Premium</Text>

        <Item label="AR Try-On" route="ARStudioMainV2" image={require("../../../assets/icons/ar_tryon.png")} />
        <Item label="360° Preview" route="AR360PreviewScreen" image={require("../../../assets/icons/tryon360.png")} />
        <Item label="Hair Health Scanner" route="HairHealthScannerScreen" image={require("../../../assets/icons/hair_scanner.png")} />
        <Item label="Hair Mixer Pro" route="HairMixerPro" image={require("../../../assets/icons/hair_mixer.png")} />
        <Item label="AI Styles" route="AIStylesScreen" image={require("../../../assets/icons/ai_styles.png")} />
        <Item label="Compare Products" route="CompareProductsScreen" image={require("../../../assets/icons/compare_products.png")} />
        <Item label="Trend Radar" route="TrendRadar" image={require("../../../assets/icons/trend_radar.png")} />
        <Item label="AI Chat" route="AIChatScreen" image={require("../../../assets/icons/ai_chat.png")} />
        <Item label="Progress Tracker" route="ProgressTrackerScreen" image={require("../../../assets/icons/progress_tracker.png")} />
        <Item label="Settings" route="SettingsScreen" icon="settings" />

        <Pressable onPress={close} style={s.closeBtn}>
          <Text style={s.closeTxt}>Close</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },

  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: "#fff",
    paddingTop: 56,
    paddingHorizontal: 18,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
  },

  title: { fontSize: 22, fontWeight: "900", color: "#000", marginBottom: 14 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  left: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
  label: { fontSize: 16, fontWeight: "700", color: "#111" },

  closeBtn: {
    marginTop: 18,
    backgroundColor: "#000",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  closeTxt: { color: "#fff", fontWeight: "800" },
});
