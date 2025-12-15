import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon } from "./Icons";

type GuideProps = {
  storageKey: string; // e.g. "@omnitintai:guide_ar"
  title: string; // e.g. "Pro tips for AR Try-On"
  bullets: string[]; // 3–5 bullets
  visible: boolean;
  onClose: () => void;
};

export async function hasSeenGuide(storageKey: string) {
  const v = await AsyncStorage.getItem(storageKey);
  return v === "1";
}

export async function markGuideSeen(storageKey: string) {
  await AsyncStorage.setItem(storageKey, "1");
}

export default function FeatureGuideOverlay({
  storageKey,
  title,
  bullets,
  visible,
  onClose,
}: GuideProps) {
  if (!visible) return null;

  const handleClose = async () => {
    await markGuideSeen(storageKey);
    onClose();
  };

  return (
    <View style={s.wrap} pointerEvents="auto">
      <View style={s.card}>
        <View style={s.header}>
          <View style={s.badge}>
            <Icon name="sparkles" size={14} color="#fff" />
            <Text style={s.badgeTxt}>PRO TIPS</Text>
          </View>

          <TouchableOpacity onPress={handleClose} style={s.closeBtn} activeOpacity={0.85}>
            <Icon name="close" size={18} color="#111" />
          </TouchableOpacity>
        </View>

        <Text style={s.title}>{title}</Text>

        <View style={s.list}>
          {bullets.map((b, idx) => (
            <View key={`${idx}-${b}`} style={s.row}>
              <View style={s.dot} />
              <Text style={s.bullet}>{b}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.primary} onPress={handleClose} activeOpacity={0.9}>
          <Text style={s.primaryTxt}>Got it</Text>
        </TouchableOpacity>

        <Text style={s.footer}>Shown once — you can always re-open this from Settings later.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    zIndex: 9999,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 14, fontSize: 18, fontWeight: "900", color: "#111" },
  list: { marginTop: 12, gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#111", marginTop: 7 },
  bullet: { flex: 1, fontSize: 14, lineHeight: 20, color: "#111" },
  primary: {
    marginTop: 16,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryTxt: { color: "#fff", fontSize: 14, fontWeight: "900" },
  footer: { marginTop: 10, fontSize: 11, color: "#6B7280", textAlign: "center" },
});
