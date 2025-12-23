// client/src/components/TelemetryOnboardingModal.tsx
import React, { useEffect } from "react";
import { Modal, View, Text, StyleSheet, Pressable, BackHandler } from "react-native";
import { useThemePro } from "../context/ThemeContext";

export default function TelemetryOnboardingModal({
  visible,
  onChoose,
}: {
  visible: boolean;
  onChoose: (choice: boolean) => void;
}) {
  const { colors } = useThemePro?.() || { colors: {} };

  // ✅ Block Android hardware back while visible (forces a choice)
  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // ✅ Prevent swipe/back dismiss on Android
      onRequestClose={() => {}}
    >
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: colors?.card || "#FFF" }]}>
          <Text style={[s.title, { color: colors?.text || "#111" }]}>
            Help Improve OmniTintAI?
          </Text>

          <Text style={[s.body, { color: colors?.mute || "#6B7280" }]}>
            We can use anonymized usage stats (scan scores + product usage) to improve recommendations for everyone.
            {"\n\n"}• No photos ever sent{"\n"}• No personal info shared{"\n"}• You can turn this off anytime in Settings
          </Text>

          <View style={s.btnRow}>
            <Pressable
              style={[s.btn, s.secondary, { borderColor: colors?.divider || "#E5E7EB" }]}
              onPress={() => onChoose(false)}
            >
              <Text style={[s.secondaryText, { color: colors?.text || "#111" }]}>
                No thanks
              </Text>
            </Pressable>

            <Pressable
              style={[s.btn, s.primary, { backgroundColor: colors?.accent || "#111" }]}
              onPress={() => onChoose(true)}
            >
              <Text style={[s.primaryText, { color: colors?.contrast || "#FFF" }]}>
                Yes, help improve
              </Text>
            </Pressable>
          </View>

          <Text style={[s.micro, { color: colors?.mute || "#6B7280" }]}>
            This choice is required to continue. You can change it anytime in Settings.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    maxWidth: 420,
    alignSelf: "center",
  },
  title: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  btnRow: { flexDirection: "row", gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primary: {},
  secondary: { borderWidth: 1 },
  primaryText: { fontSize: 15, fontWeight: "800" },
  secondaryText: { fontSize: 15, fontWeight: "800" },
  micro: { marginTop: 14, fontSize: 12, textAlign: "center" },
});
