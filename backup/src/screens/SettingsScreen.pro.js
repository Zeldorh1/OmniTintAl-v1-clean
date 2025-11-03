import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, TextInput, Pressable, ScrollView, Linking } from "react-native";
import { useThemePro } from "../../context/ThemeContext";

export default function SettingsScreenPro({ navigation }) {
  const { colors, mode, setMode, setAccent } = useThemePro();
  const [notifications, setNotifications] = useState(true);
  const isDark = mode === "dark";

  const swatches = ["#FDAE5F", "#FDC875", "#FF6F91", "#03A9F4", "#8BC34A", "#7E57C2"];
  const open = (url) => Linking.openURL(url);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.header, { color: colors.text }]}>Settings</Text>

      {/* Theme */}
      <View style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
          <Switch value={isDark} onValueChange={(v) => setMode(v ? "dark" : "light")} />
        </View>

        <Text style={[styles.sub, { color: colors.mute }]}>Accent Color</Text>
        <View style={styles.swatches}>
          {swatches.map((c) => (
            <Pressable key={c} onPress={() => setAccent(c)} style={[styles.swatch, { backgroundColor: c }]} />
          ))}
        </View>

        <TextInput
          placeholder="Custom HEX (e.g. #FF5722)"
          placeholderTextColor={colors.mute}
          onSubmitEditing={(e) => setAccent(e.nativeEvent.text)}
          style={[styles.input, { color: colors.text, borderColor: colors.divider, backgroundColor: isDark ? "#0f0f0f" : "#fff" }]}
        />
      </View>

      {/* Personalization */}
      <Pressable onPress={() => navigation.navigate("PersonalizationSurvey")} style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Refine My Recommendations</Text>
        <Text style={[styles.helper, { color: colors.mute }]}>Optional survey to tailor styles, products, and tips</Text>
      </Pressable>

      {/* Notifications */}
      <View style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>AI Tips & Trend Alerts</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <Text style={[styles.helper, { color: colors.mute }]}>We’ll only send occasional helpful tips and trend highlights.</Text>
      </View>

      {/* Support */}
      <Pressable onPress={() => open("mailto:support@luxwavelabs.com?subject=OmniTintAI%20Feedback")} style={[styles.btn, { backgroundColor: colors.accent }]}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>Feedback / Report an Issue</Text>
      </Pressable>

      {/* Legal */}
      <View style={styles.legalRow}>
        <Pressable onPress={() => open("https://luxwavelabs.com/terms")}><Text style={[styles.link, { color: colors.text }]}>Terms</Text></Pressable>
        <Text style={[styles.dot, { color: colors.mute }]}> • </Text>
        <Pressable onPress={() => open("https://luxwavelabs.com/privacy")}><Text style={[styles.link, { color: colors.text }]}>Privacy</Text></Pressable>
      </View>
      <Text style={[styles.about, { color: colors.mute }]}>OmniTintAI © 2025 • v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 8 },
  helper: { fontSize: 12, marginTop: 6 },
  swatches: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 10 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#00000020" },
  input: { height: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10 },
  btn: { marginTop: 10, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  legalRow: { marginTop: 18, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  link: { fontWeight: "800" },
  dot: { opacity: 0.7, marginHorizontal: 6 },
  about: { textAlign: "center", marginTop: 8, fontSize: 12, opacity: 0.75 },
});
