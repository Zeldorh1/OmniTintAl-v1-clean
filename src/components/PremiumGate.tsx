// src/components/PremiumGate.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePremium } from "../context/PremiumContext";

type Props = {
  featureTitle: string;     // e.g. "Hair Health Scanner"
  featureKey: string;       // e.g. "HAIR_SCANNER"
  usesLeft?: number;        // optional override (otherwise pulled from context)
};

export default function PremiumGate({ featureTitle, featureKey, usesLeft }: Props) {
  const navigation = useNavigation<any>();
  const { isPremium, usesLeft: contextUsesLeft, setPremium } = usePremium();

  const fromContext = !isPremium ? Number(contextUsesLeft(featureKey) ?? 0) : Infinity;

  const remaining = isPremium
    ? Infinity
    : typeof usesLeft === "number"
    ? usesLeft
    : fromContext;

  const isHardGate = !isPremium && remaining <= 0;

  const handleUpgrade = () => {
    Alert.alert(
      "Premium (Demo)",
      "For now this simulates a successful Premium purchase.",
      [
        {
          text: "Unlock Premium",
          onPress: async () => {
            await setPremium(true);
            navigation.goBack();
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleMaybeLater = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>Premium</Text>

      <Text style={styles.title}>{featureTitle}</Text>

      {isPremium ? (
        <>
          <Text style={styles.body}>
            You’ve unlocked this feature with OmniTintAI Premium. Enjoy unlimited access.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleMaybeLater}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </>
      ) : isHardGate ? (
        <>
          <Text style={styles.body}>
            You’ve used all your free access for this feature. Upgrade to unlock unlimited use.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleUpgrade}>
            <Text style={styles.primaryBtnText}>Unlock Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleMaybeLater}>
            <Text style={styles.secondaryBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.body}>
            This is a Premium feature. You still have{" "}
            <Text style={styles.highlight}>{remaining}</Text> free use
            {remaining === 1 ? "" : "s"} left before upgrading.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleMaybeLater}>
            <Text style={styles.primaryBtnText}>Use a Free Try</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleUpgrade}>
            <Text style={styles.secondaryBtnText}>Unlock Premium Now</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.footer}>
        Premium unlocks advanced AI & AR experiences, removes limits, and keeps new features ad-free.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingTop: 80, alignItems: "center" },
  badge: {
    fontSize: 14, fontWeight: "700", color: "#111", backgroundColor: "#FFD700",
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#000", textAlign: "center", marginBottom: 16 },
  body: { fontSize: 16, color: "#333", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  highlight: { fontWeight: "800" },
  primaryBtn: {
    width: "100%", backgroundColor: "#000", borderRadius: 999,
    paddingVertical: 16, alignItems: "center", marginBottom: 12,
  },
  primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    width: "100%", borderRadius: 999, paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#DDD", marginBottom: 24,
  },
  secondaryBtnText: { color: "#333", fontSize: 14, fontWeight: "600" },
  footer: { fontSize: 12, color: "#999", textAlign: "center", position: "absolute", bottom: 40, left: 32, right: 32 },
});
