// client/navigation/PremiumNavigator.js
// Drop-in: Premium Navigator with SafeScreen fallback, retry counter,
// and diagnostic auto-report wiring (Zoho Desk via support@luxwavelabs.com)

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  DevSettings,
  Platform,
  Alert,
  ToastAndroid,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// ------------------------------
// Screen Imports (locked path rule: ../src/screens/...)
// ------------------------------
import ARStudioMainV2 from "../src/screens/premium/ARStudioMainV2";
import AR360PreviewScreen from "../src/screens/premium/AR360PreviewScreen";
import CompareProductsScreen from "../src/screens/premium/CompareProductsScreen";
import HairHealthScannerScreen from "../src/screens/premium/HairHealthScannerScreen";
import HairMixerPro from "../src/screens/premium/HairMixerPro";
import PremiumMenu from "../src/screens/premium/PremiumMenu";
import TrendRadarScreen from "../src/screens/premium/TrendRadarScreen";
import ProgressTrackerScreen from "../src/screens/premium/ProgressTrackerScreen";
import AIChatScreen from "../src/screens/premium/AIChatScreen";
import AIStylesScreen from "../src/screens/premium/AIStylesScreen";
import SettingsScreen from "../src/screens/premium/SettingsScreen";
import HairScanResultDynamic from "../src/screens/premium/HairScanResultDynamic";
import HairHealthResultGood from "../src/screens/premium/HairHealthResultGood";
import HairHealthResultRecovery from "../src/screens/premium/HairHealthResultRecovery";

const Stack = createNativeStackNavigator();

// ------------------------------
// Diagnostics wiring
// ------------------------------
const SUPPORT_EMAIL = "support@luxwavelabs.com"; // routes to Desk via your forwarding
const FAILURE_COUNT_KEY = "omnitint.safeScreen.failures";
const FAILURE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const FAILURE_TIMESTAMPS_KEY = "omnitint.safeScreen.window";

function nowISO() {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
}

async function incrementFailureCount() {
  try {
    const raw = await AsyncStorage.getItem(FAILURE_TIMESTAMPS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - FAILURE_WINDOW_MS;
    const pruned = arr.filter((t) => Number(t) > cutoff);
    pruned.push(Date.now());
    await AsyncStorage.setItem(FAILURE_TIMESTAMPS_KEY, JSON.stringify(pruned));
    return pruned.length;
  } catch {
    // fallback simple integer counter
    const nRaw = (await AsyncStorage.getItem(FAILURE_COUNT_KEY)) || "0";
    const n = Number(nRaw) + 1;
    await AsyncStorage.setItem(FAILURE_COUNT_KEY, String(n));
    return n;
  }
}

function showToast(msg) {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("Notice", msg);
}

async function sendDiagnosticsEmail({ screen, error, stack }) {
  const payload = {
    screen: screen || "(unknown)",
    error: String(error || "(no message)"),
    stack: String(stack || "(no stack)"),
    sdkVersion: Constants?.expoConfig?.sdkVersion || "unknown",
    appVersion:
      Constants?.expoConfig?.version || Constants?.manifest2?.extra?.version || "unknown",
    device: `${Platform.OS} ${Platform.Version}`,
    timestamp: nowISO(),
  };

  const subject = encodeURIComponent(
    `OmniTintAI Diagnostics — ${payload.screen} — ${payload.timestamp}`
  );
  const body = encodeURIComponent(
    [
      `Screen: ${payload.screen}`,
      `Timestamp: ${payload.timestamp}`,
      `SDK: ${payload.sdkVersion}`,
      `App: ${payload.appVersion}`,
      `Device: ${payload.device}`,
      `Error: ${payload.error}`,
      `Stack: ${payload.stack.substring(0, 1800)}`,
    ].join("\n")
  );

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  try {
    const can = await Linking.canOpenURL(mailto);
    if (can) {
      await Linking.openURL(mailto);
      showToast("Diagnostics prepared — please send");
      return true;
    }
  } catch (e) {
    console.log("[Diagnostics] mailto failed", e);
  }
  // If mail client unavailable, at least log locally
  console.log("[Diagnostics] ", payload);
  showToast("Logged diagnostics locally");
  return false;
}

// --------------------------------------
// SafeScreen fallback with dual recovery
// --------------------------------------
class SafeScreenInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  async componentDidCatch(error) {
    // Count within rolling window; auto-send after 2+ in 10 minutes
    const count = await incrementFailureCount();
    console.log(`[SafeScreen] failures in window: ${count}`);
    if (count >= 2) {
      await sendDiagnosticsEmail({
        screen: this.props.screenName,
        error: error?.message || String(error),
        stack: error?.stack,
      });
      showToast("Diagnostics sent ✅");
    }
  }
  render() {
    if (this.state.hasError) return this.props.renderFallback(this.state.error);
    return this.props.children;
  }
}

const SafeScreen = ({ children, screenName }) => {
  const navigation = useNavigation();

  const handleRestart = () => {
    try {
      DevSettings.reload();
    } catch (e) {
      Alert.alert("Restart failed", String(e?.message || e));
    }
  };

  const handleReturnHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "PremiumMenu" }] });
  };

  const renderFallback = (error) => (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>⚠️ Something went wrong</Text>
      <Text style={styles.fallbackMsg}>
        You can try the options below to recover. If the first doesn’t help, try the second.
      </Text>

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={handleRestart}>
          <Text style={styles.btnText}>🔁 Restart App</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={handleReturnHome}>
          <Text style={styles.btnText}>↩️ Return to Home</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.btn, { marginTop: 10 }]}
        onPress={() =>
          sendDiagnosticsEmail({ screen: screenName, error: error?.message, stack: error?.stack })
        }
      >
        <Text style={styles.btnText}>📤 Send Diagnostics Now</Text>
      </Pressable>

      <Text style={styles.tipText}>
        We only send non-personal technical details to help fix issues quickly.
      </Text>
      <Text style={styles.errorText}>{String(error?.message || error)}</Text>
    </View>
  );

  return (
    <SafeScreenInner renderFallback={renderFallback} screenName={screenName}>
      {children}
    </SafeScreenInner>
  );
};

const wrap = (Comp, name) => (props) => (
  <SafeScreen screenName={name}>
    <Comp {...props} />
  </SafeScreen>
);

// --------------------------------------
// Navigator
// --------------------------------------
export default function PremiumNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      initialRouteName="PremiumMenu"
    >
      <Stack.Screen name="PremiumMenu" component={wrap(PremiumMenu, "PremiumMenu")} />
      <Stack.Screen name="ARStudioMainV2" component={wrap(ARStudioMainV2, "ARStudioMainV2")} />
      <Stack.Screen name="AR360PreviewScreen" component={wrap(AR360PreviewScreen, "AR360PreviewScreen")} />
      <Stack.Screen name="CompareProductsScreen" component={wrap(CompareProductsScreen, "CompareProductsScreen")} />
      <Stack.Screen name="HairHealthScannerScreen" component={wrap(HairHealthScannerScreen, "HairHealthScannerScreen")} />
      <Stack.Screen name="HairMixerPro" component={wrap(HairMixerPro, "HairMixerPro")} />
      <Stack.Screen name="ProgressTrackerScreen" component={wrap(ProgressTrackerScreen, "ProgressTrackerScreen")} />
      <Stack.Screen name="TrendRadarScreen" component={wrap(TrendRadarScreen, "TrendRadarScreen")} />
      <Stack.Screen name="AIChatScreen" component={wrap(AIChatScreen, "AIChatScreen")} />
      <Stack.Screen name="AIStylesScreen" component={wrap(AIStylesScreen, "AIStylesScreen")} />
      <Stack.Screen name="SettingsScreen" component={wrap(SettingsScreen, "SettingsScreen")} />
      <Stack.Screen name="HairScanResultDynamic" component={wrap(HairScanResultDynamic, "HairScanResultDynamic")} />
      <Stack.Screen name="HairHealthResultGood" component={wrap(HairHealthResultGood, "HairHealthResultGood")} />
      <Stack.Screen name="HairHealthResultRecovery" component={wrap(HairHealthResultRecovery, "HairHealthResultRecovery")} />
    </Stack.Navigator>
  );
}

// --------------------------------------
// Styles
// --------------------------------------
const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  fallbackTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  fallbackMsg: { color: "#ccc", textAlign: "center", marginBottom: 10 },
  btnRow: { flexDirection: "row", marginTop: 16, gap: 10 },
  btn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  tipText: { marginTop: 10, color: "#ccc", fontSize: 12, textAlign: "center" },
  errorText: { marginTop: 10, color: "#888", fontSize: 11, textAlign: "center" },
});
