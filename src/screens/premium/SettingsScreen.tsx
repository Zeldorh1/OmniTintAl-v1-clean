// client/src/screens/premium/SettingsScreenPro.js
import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import GrokLogo from "../../../assets/grok-logo.svg";
import Robot from "../../../assets/robot.svg";
import Search from "../../../assets/icons/search.svg";
import Zap from "../../../assets/icons/zap.svg";
import ShoppingCart from "../../../assets/icons/shopping-cart.svg";
import Rocket from "../../../assets/icons/rocket.svg";
import Atom from "../../../assets/icons/atom.svg";

import * as MailComposer from "expo-mail-composer";
import * as LocalAuthentication from "expo-local-authentication";
import * as Application from "expo-application";
import * as Notifications from "expo-notifications";
import * as IntentLauncher from "expo-intent-launcher";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useSettings } from "../../context/SettingsContext";
import { useThemePro } from "../../context/ThemeContext";
import { SUPPORT_EMAIL } from "../../utils/constants";

function Section({ title, children, noPadTop }) {
  return (
    <View style={[s.card, !noPadTop && { marginTop: 16 }]}>
      {!!title && <Text style={s.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

function Row({ left, right }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>{left}</View>
      {!!right && <View style={{ marginLeft: 10 }}>{right}</View>}
    </View>
  );
}

function ToggleRow({ title, subtitle, value, onValueChange }) {
  return (
    <Row
      left={<Label title={title} subtitle={subtitle} />}
      right={<Switch value={value} onValueChange={onValueChange} />}
    />
  );
}

function Label({ title, subtitle }) {
  return (
    <View>
      <Text style={s.rowTitle}>{title}</Text>
      {!!subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
    </View>
  );
}

function Segment({ options, value, onChange, fullWidth }) {
  return (
    <View style={[s.segment, fullWidth && { width: "100%" }]}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[
            s.segBtn,
            value === o.key && s.segBtnActive,
            fullWidth && s.segBtnFluid,
          ]}
        >
          <Text style={[s.segText, value === o.key && s.segTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MiniBtn({ text, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.miniBtn, danger && { borderColor: "#E53935" }]}
    >
      <Text style={[s.miniBtnText, danger && { color: "#E53935" }]}>{text}</Text>
    </TouchableOpacity>
  );
}

function PrimaryBtn({ text, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.primaryBtn}>
      <Text style={s.primaryText}>{text}</Text>
    </TouchableOpacity>
  );
}

function DangerBtn({ text, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.dangerBtn}>
      <Text style={s.dangerText}>{text}</Text>
    </TouchableOpacity>
  );
}

function TextBadge({ label }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{label}</Text>
    </View>
  );
}

export default function SettingsScreenPro({ navigation }) {
  const { width } = useWindowDimensions();
  const isSmall = width < 380; // kept if you ever want size-based tweaks

  const { settings, update, resetAll } = useSettings();
  const [reportText, setReportText] = useState("");

  const { colors, mode, setMode, heartColor, setHeartColor } = useThemePro();
  const bg = colors.background;
  const text = colors.text;
  const subText = colors.subtext;
  const cardBg = colors.card;

  // Guard so this never crashes if account isn't initialized yet
  const account = settings?.account ?? { signedIn: false, userId: null, email: null };

  const signIn = () => {
    const uid = "omni_" + Math.random().toString(36).slice(2, 8);
    update({ account: { signedIn: true, userId: uid, email: null } });
    Alert.alert("Signed in", "Local account created.");
  };

  const signOut = () => {
    update({ account: { signedIn: false, userId: null, email: null } });
    Alert.alert("Signed out", "This device is signed out.");
  };

  const deleteAccount = async () => {
    Alert.alert(
      "Delete account",
      "This will delete your personal data stored on this device (favorites, measurements, settings). This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Promise.all([
              AsyncStorage.removeItem("omni_settings_v1"),
              AsyncStorage.removeItem("omni_progress_entries_v1"),
              AsyncStorage.removeItem("omni_favs_v1"),
              AsyncStorage.removeItem("@omnitintai:progress_entries_v2"),
            ]);
            await resetAll();
            Alert.alert("Deleted", "Local account & data removed from this device.");
          },
        },
      ]
    );
  };

  const toggleBiometric = async (next) => {
    if (next) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (!hasHardware || !types?.length) {
        Alert.alert("Not available", "This device does not support biometrics.");
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert("No biometrics enrolled", "Please enroll in your phone settings first.");
        return;
      }
    }
    update({ biometricLock: next });
  };

  const toggleNotifications = async (next) => {
    if (next) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Enable notifications in system settings.");
        return;
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    update({ notificationsEnabled: next });
  };

  const openOSSettings = async () => {
    if (Platform.OS === "ios") Linking.openURL("app-settings:");
    else {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: "package:" + Application.applicationId }
      );
    }
  };

  // Final, safe problem-report handler
  const sendReport = async () => {
    const body = reportText.trim() || "(empty)";
    try {
      const can = await MailComposer.isAvailableAsync();
      if (can) {
        await MailComposer.composeAsync({
          recipients: [SUPPORT_EMAIL],
          subject: "OmniTintAI – Problem report",
          body,
        });
      } else {
        const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
          "OmniTintAI – Problem report"
        )}&body=${encodeURIComponent(body)}`;
        Linking.openURL(url);
      }
      setReportText("");
    } catch {
      Alert.alert("Error", "Could not open mail client.");
    }
  };

  const themeOptions = useMemo(
    () => [
      { key: "light", label: "Light" },
      { key: "dark", label: "Dark" },
    ],
    []
  );

  const HEART_SWATCHES = ["#E53935", "#FF6F91", "#FDAE5F", "#03A9F4", "#8BC34A", "#7E57C2", "#000000"];

  const APP_VERSION = Constants?.expoConfig?.version ?? "1.0.0";
  const BUILD_NUMBER = Platform.select({
    ios: Constants?.manifest?.ios?.buildNumber ?? "1",
    android: Constants?.manifest?.android?.versionCode ?? "1",
  });

  const open = (url) => Linking.openURL(url).catch(() => Alert.alert("Error", "Link failed"));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={[s.h1, { color: text }]}>Settings</Text>

        {/* ACCOUNT */}
        <Section title="Account">
          <Row
            left={
              <Label
                title={account.signedIn ? "Signed in" : "Not signed in"}
                subtitle={account.userId || "Create a local account"}
              />
            }
            right={
              account.signedIn ? (
                <View style={{ flexDirection: "row" }}>
                  <MiniBtn text="Sign out" onPress={signOut} />
                  <MiniBtn text="Delete" danger onPress={deleteAccount} />
                </View>
              ) : (
                <MiniBtn text="Sign in" onPress={signIn} />
              )
            }
          />
        </Section>

        {/* PRIVACY & SECURITY */}
        <Section title="Privacy & Security">
          <ToggleRow
            title="Voice wake (“Hey Omni”)"
            value={settings.voiceWakeEnabled}
            onValueChange={(v) => update({ voiceWakeEnabled: v })}
          />
          <ToggleRow
            title="Microphone access"
            value={settings.microphoneEnabled}
            onValueChange={(v) => update({ microphoneEnabled: v })}
          />
          <ToggleRow
            title="Share anonymized usage stats"
            subtitle="Off by default. We never upload photos."
            value={settings.shareAnonymizedStats}
            onValueChange={(v) => update({ shareAnonymizedStats: v })}
          />
          <ToggleRow
            title="Biometric lock"
            subtitle="Require Face/Touch ID"
            value={settings.biometricLock}
            onValueChange={toggleBiometric}
          />
          <Row
            left={<Label title="System permissions" subtitle="Camera, Notifications, etc." />}
            right={<MiniBtn text="Open settings" onPress={openOSSettings} />}
          />
        </Section>

        {/* NOTIFICATIONS */}
        <Section title="Notifications">
          <ToggleRow
            title="Enable notifications"
            value={settings.notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </Section>

        {/* APPEARANCE */}
        <Section title="Appearance">
          <Row
            left={<Label title="Theme" subtitle="Light or Dark" />}
            right={<Segment options={themeOptions} value={mode} onChange={setMode} />}
          />

          <Text style={[s.label, { color: text, marginTop: 16 }]}>Background color</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            {["#FFFFFF", "#F6F6F6", "#EFEFEF", "#FFFAF2", "#F2FAFF", "#F9F1FF"].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => update({ backgroundColor: c })}
                style={[
                  s.swatch,
                  {
                    backgroundColor: c,
                    borderWidth: c === settings.backgroundColor ? 3 : 1,
                    borderColor: c === settings.backgroundColor ? text : "#ddd",
                  },
                ]}
              />
            ))}
          </View>

          <Text style={[s.label, { color: text, marginTop: 16 }]}>Heart color</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            {HEART_SWATCHES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setHeartColor(c)}
                style={[
                  s.swatch,
                  {
                    backgroundColor: c,
                    borderWidth: c === heartColor ? 3 : 1,
                    borderColor: c === heartColor ? text : "#ddd",
                  },
                ]}
              />
            ))}
          </View>
        </Section>

        {/* REPORT A PROBLEM */}
        <Section title="Report a problem">
          <TextInput
            value={reportText}
            onChangeText={setReportText}
            placeholder="Tell us what happened…"
            placeholderTextColor={subText}
            style={[s.textarea, { color: text, borderColor: subText }]}
            multiline
          />
          <PrimaryBtn text="Send report via email" onPress={sendReport} />
        </Section>

        {/* CREDITS */}
        <Section title="Credits">
          <View style={[s.credits, { backgroundColor: cardBg }]}>
            <Text style={[s.appName, { color: text }]}>OmniTintAI</Text>
            <Text style={[s.version, { color: subText }]}>
              v{APP_VERSION} · Build {BUILD_NUMBER}
            </Text>

            <View style={s.hero}>
              <Text style={[s.made, { color: subText }]}>Created by</Text>
              <Text style={[s.name, { color: text }]}>Zeldorh</Text>
            </View>

            <Text style={[s.poweredTitle, { color: text, marginTop: 24 }]}>Powered by</Text>

            <View style={s.grid}>
              <TouchableOpacity style={s.lib} onPress={() => open("https://x.ai")}>
                <GrokLogo width={36} height={36} />
                <Text style={[s.libName, { color: subText }]}>Grok AI</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.lib} onPress={() => open("https://openai.com")}>
                <Robot width={30} height={30} fill={text} />
                <Text style={[s.libName, { color: subText }]}>ChatGPT</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.lib} onPress={() => open("https://cloudflare.com")}>
                <Zap width={30} height={30} fill={text} />
                <Text style={[s.libName, { color: subText }]}>Cloudflare</Text>
              </TouchableOpacity>

              {/* Leonardo.ai — no vector icons, keep credits */}
              <TouchableOpacity style={s.lib} onPress={() => open("https://leonardo.ai")}>
                <TextBadge label="AI" />
                <Text style={[s.libName, { color: subText }]}>Leonardo.ai</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.lib} onPress={() => open("https://affiliate-program.amazon.com")}>
                <ShoppingCart width={30} height={30} stroke={text} />
                <Text style={[s.libName, { color: subText }]}>Amazon PA-API</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.lib} onPress={() => open("https://threejs.org")}>
                <Atom width={30} height={30} stroke={text} />
                <Text style={[s.libName, { color: subText }]}>Three.js</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.lib} onPress={() => open("https://mediapipe.dev")}>
                <Search width={30} height={30} stroke={text} />
                <Text style={[s.libName, { color: subText }]}>MediaPipe</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.lib} onPress={() => open("https://expo.dev")}>
                <Rocket width={30} height={30} stroke={text} />
                <Text style={[s.libName, { color: subText }]}>Expo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.lib} onPress={() => open("https://reactnative.dev")}>
                <Atom width={30} height={30} stroke={text} />
                <Text style={[s.libName, { color: subText }]}>React Native</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.copyright, { color: subText, marginTop: 32 }]}>
              © 2025 OmniTintAI · All rights reserved{"\n"}
              Built with love and open-source libraries
            </Text>
          </View>
        </Section>

        <Section title=" " noPadTop>
          {account.signedIn && <DangerBtn text="Sign out" onPress={signOut} />}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontWeight: "800", fontSize: 15, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rowTitle: { fontWeight: "700" },
  rowSub: { marginTop: 2, fontSize: 12, opacity: 0.7 },
  segment: { flexDirection: "row", backgroundColor: "#F1F1F1", borderRadius: 12, padding: 4 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  segBtnActive: { backgroundColor: "#111" },
  segBtnFluid: { flexGrow: 1, minWidth: "46%", alignItems: "center" },
  segText: { fontWeight: "700" },
  segTextActive: { color: "#fff" },
  miniBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 6 },
  miniBtnText: { fontWeight: "700" },
  primaryBtn: { backgroundColor: "#111", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignSelf: "flex-start", marginTop: 10 },
  primaryText: { color: "#fff", fontWeight: "800" },
  dangerBtn: { borderWidth: 1, borderColor: "#E53935", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  dangerText: { color: "#E53935", fontWeight: "800" },
  swatch: { width: 32, height: 32, borderRadius: 8, marginRight: 10 },
  textarea: { borderWidth: 1, borderRadius: 12, padding: 12, height: 100, textAlignVertical: "top" },
  label: { fontWeight: "700", marginBottom: 6 },
  credits: { borderRadius: 20, padding: 20, alignItems: "center" },
  appName: { fontSize: 22, fontWeight: "900" },
  version: { fontSize: 12, marginTop: 4 },
  hero: { alignItems: "center", marginVertical: 16 },
  made: { fontSize: 13, opacity: 0.7 },
  name: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  poweredTitle: { fontSize: 16, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 24, marginTop: 16 },
  lib: { alignItems: "center", width: 80 },
  libName: { fontSize: 11, textAlign: "center", marginTop: 6, opacity: 0.8 },
  copyright: { fontSize: 11, opacity: 0.7 },

  // tiny badge for Leonardo so we don't use vector-icons
  badge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontWeight: "900", fontSize: 12, color: "#111" },
});
