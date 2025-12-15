// src/navigation/DrawerMenu.pro.js
import React from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

export default function DrawerMenuPro({ navigation, closeDrawer }) {
  const items = [
    { label: "AR Try-On", icon: "color-palette-outline", route: "ARTryOn" },
    { label: "360° Preview", icon: "cube-outline", route: "AR360Preview" },
    { label: "Hair Health Scanner", icon: "heart-outline", route: "HairHealthScanner" },
    { label: "AI Chatbox", icon: "chatbubble-ellipses-outline", route: "AIChatbox" },
    { label: "Settings", icon: "settings-outline", route: "Settings" },
  ];

  return (
    <View style={styles.drawer}>
      <Text style={styles.title}>OmniTintAI Studio</Text>
      {items.map((item, i) => (
        <Pressable
          key={i}
          style={styles.item}
          onPress={() => {
            navigation.navigate(item.route);
            closeDrawer?.();
          }}
        >
          <Ionicons name={item.icon} size={22} color="#D4AF37" style={styles.icon} />
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.close} onPress={closeDrawer}>
        <Text style={styles.closeText}>Close ✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    width: width * 0.8, // 80% of screen width
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 24,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    color: "#000",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  close: {
    marginTop: 40,
    backgroundColor: "#000",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
  },
});
