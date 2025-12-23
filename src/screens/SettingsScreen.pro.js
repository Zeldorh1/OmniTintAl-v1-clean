// client/src/Settings/SettingsScreenPro.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { useThemePro } from "../../context/ThemeContext";
import TelemetryConsentCard from "../../components/TelemetryConsentCard";

export default function SettingsScreenPro({ navigation }: any) {
  const {
    colors,
    mode,
    setMode,
    setAccent,
    lang,
    setLang,
    autoLang,
    setAutoLang,
    t,
  } = useThemePro();

  const [notifications, setNotifications] = useState(true);
  const isDark = mode === "dark";

  const swatches = ["#FDAE5F", "#FDC875", "#FF6F91", "#03A9F4", "#8BC34A", "#7E57C2"];
  const open = (url: string) => Linking.openURL(url).catch(() => {});

  const showLicenses = () => {
    Alert.alert(
      t.licenses,
      `AI Hair Stylist\n• Grok by xAI – https://x.ai\n  Real-time style recommendations and AR precision\n\nOpen Source Libraries\n• Three.js – MIT License\n  https://github.com/mrdoob/three.js\n\n• MediaPipe – Apache 2.0\n  https://github.com/google/mediapipe\n\n• Vision Camera – MIT\n  https://github.com/mrousavy/react-native-vision-camera\n\n• Reanimated – MIT\n  https://github.com/software-mansion/react-native-reanimated\n\n• Expo – MIT\n  https://github.com/expo/expo\n\nAll 3D hair models © OmniTintAI 2025`,
      [{ text: t.close, style: "cancel" }]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={[styles.header, { color: colors.text }]}>{t.settings}</Text>

      {/* Appearance */}
      <View style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>{t.darkMode}</Text>
          <Switch value={isDark} onValueChange={(v) => setMode(v ? "dark" : "light")} />
        </View>
      </View>

      <View style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>{t.accentColor}</Text>

        <View style={styles.swatches}>
          {swatches.map((c) => (
            <Pressable
              key={c}
              onPress={() => setAccent(c)}
              style={[
                styles.swatch,
                { backgroundColor: c },
                colors.accent === c && styles.swatchActive,
              ]}
            >
              {colors.accent === c && <View style={styles.swatchCheck} />}
            </Pressable>
          ))}
        </View>

        <View style={styles.hexRow}>
          <TextInput
            placeholder={t.customHex}
            placeholderTextColor={colors.mute}
            onSubmitEditing={(e) => {
              let hex = e.nativeEvent.text.trim().toUpperCase();
              if (/^#[0-9A-F]{6}$/i.test(hex)) setAccent(hex);
              else if (/^[0-9A-F]{6}$/i.test(hex)) setAccent("#" + hex);
            }}
            style={[
              styles.hexInput,
              {
                color: colors.text,
                borderColor: colors.divider,
                backgroundColor: isDark ? "#111" : "#fff",
              },
            ]}
            maxLength={7}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <View style={[styles.hexPreview, { backgroundColor: colors.accent, borderColor: colors.divider }]} />
        </View>

        <View style={styles.previewRow}>
          <Text style={[styles.previewLabel, { color: colors.mute }]}>Preview:</Text>
          <View style={[styles.previewBar, { backgroundColor: colors.accent }]} />
        </View>
      </View>

      {/* Data & Privacy (Consent Toggle) */}
      <View style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Data & Privacy</Text>
        <Text style={[styles.helper, { color: colors.mute }]}>
          Control whether anonymized stats are shared to improve recommendations. No photos are shared.
        </Text>

        <View style={{ marginTop: 12 }}>
          <TelemetryConsentCard />
        </View>
      </View>

      {/* Language */}
      <View style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>{t.language}</Text>
          <Switch value={autoLang} onValueChange={setAutoLang} />
        </View>

        {!autoLang && (
          <View style={styles.langRow}>
            <Pressable
              onPress={() => setLang("en")}
              style={[styles.langBtn, lang === "en" && styles.langBtnActive]}
            >
              <Text style={[styles.langText, lang === "en" && styles.langTextActive]}>English</Text>
            </Pressable>

            <Pressable
              onPress={() => setLang("es")}
              style={[styles.langBtn, lang === "es" && styles.langBtnActive]}
            >
              <Text style={[styles.langText, lang === "es" && styles.langTextActive]}>Español</Text>
            </Pressable>
          </View>
        )}

        {autoLang && (
          <Text style={[styles.helper, { color: colors.mute }]}>
            {t.languageAuto} ({lang === "es" ? "Español" : "English"})
          </Text>
        )}
      </View>

      {/* Credits */}
      <Pressable
        onPress={() => open("https://x.ai")}
        style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{t.grokCredit}</Text>
        <Text style={[styles.helper, { color: colors.mute }]}>{t.grokDesc}</Text>
      </Pressable>

      {/* Personalization */}
      <Pressable
        onPress={() => navigation.navigate("PersonalizationSurvey")}
        style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{t.refine}</Text>
        <Text style={[styles.helper, { color: colors.mute }]}>{t.refineDesc}</Text>
      </Pressable>

      {/* Notifications */}
      <View style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>{t.notifications}</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <Text style={[styles.helper, { color: colors.mute }]}>{t.notifDesc}</Text>
      </View>

      {/* Feedback */}
      <Pressable
        onPress={() => open("mailto:support@luxwavelabs.com?subject=OmniTintAI%20Feedback")}
        style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{t.feedback}</Text>
      </Pressable>

      {/* Licenses */}
      <Pressable
        onPress={showLicenses}
        style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.card }]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{t.licenses}</Text>
        <Text style={[styles.helper, { color: colors.mute }]}>{t.licensesDesc}</Text>
      </Pressable>

      {/* Legal */}
      <View style={styles.legalRow}>
        <Pressable onPress={() => open("https://luxwavelabs.com/terms")}>
          <Text style={[styles.link, { color: colors.text }]}>{t.terms}</Text>
        </Pressable>
        <Text style={[styles.dot, { color: colors.mute }]}> • </Text>
        <Pressable onPress={() => open("https://luxwavelabs.com/privacy")}>
          <Text style={[styles.link, { color: colors.text }]}>{t.privacy}</Text>
        </Pressable>
      </View>

      <Text style={[styles.about, { color: colors.mute }]}>{t.about}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 16, letterSpacing: -0.3 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 15, fontWeight: "700" },
  helper: { fontSize: 12, marginTop: 6, lineHeight: 16 },

  swatches: { flexDirection: "row", gap: 12, marginTop: 12, marginBottom: 16 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  swatchActive: { borderColor: "#fff", shadowOpacity: 0.2 },
  swatchCheck: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },

  hexRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  hexInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    letterSpacing: 1,
  },
  hexPreview: { width: 44, height: 44, borderRadius: 12, borderWidth: 1 },
  previewRow: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 10 },
  previewLabel: { fontSize: 13, fontWeight: "600" },
  previewBar: { flex: 1, height: 8, borderRadius: 4 },

  langRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  langBtnActive: { backgroundColor: "#fff" },
  langText: { fontSize: 13, color: "#666" },
  langTextActive: { color: "#000", fontWeight: "600" },

  legalRow: { marginTop: 20, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  link: { fontWeight: "800", fontSize: 14 },
  dot: { opacity: 0.7, marginHorizontal: 8, fontSize: 14 },
  about: { textAlign: "center", marginTop: 12, fontSize: 12, opacity: 0.75 },
});
