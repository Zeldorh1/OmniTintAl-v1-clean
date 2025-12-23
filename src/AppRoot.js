// client/src/AppRoot.js — FINAL (Fonts + EventStore init + REQUIRED CHOICE gate)

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Font from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";

import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import AppNavigator from "../navigation/AppNavigator";

import { AppProvider } from "./context/AppContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { PremiumProvider } from "./context/PremiumContext";

import BootProbe from "./BootProbe";
import { initEventStore } from "./utils/eventLogger";

// ✅ Consent gate
import TelemetryOnboardingModal from "./components/TelemetryOnboardingModal";
import { getConsent, setConsent } from "./utils/consentStore";

function RootNavigation() {
  const t = useTheme();
  const navTheme = t?.mode === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function AppRoot() {
  const [ready, setReady] = useState(false);

  // ✅ Hard gate state
  const [consentAnswered, setConsentAnswered] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await Font.loadAsync(Ionicons.font);
        await initEventStore();

        const c = await getConsent();
        const answered = !!c?.hasAnsweredConsentPrompt;

        if (mounted) {
          setConsentAnswered(answered);
          setShowConsent(!answered);
        }
      } catch (e) {
        console.warn("[AppRoot] init error:", e);
        // fail-safe: if anything breaks, still require a choice
        if (mounted) {
          setConsentAnswered(false);
          setShowConsent(true);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleConsentChoice = async (choice) => {
    try {
      await setConsent({
        shareAnonymizedStats: !!choice,
        hasAnsweredConsentPrompt: true,
      });
    } catch (e) {
      console.warn("[Consent] save failed:", e);
      // still let them proceed; worst case they see it again next launch
    }

    setShowConsent(false);
    setConsentAnswered(true);
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider>
            <SettingsProvider>
              <FavoritesProvider>
                <CartProvider>
                  <PremiumProvider>
                    <BootProbe />

                    {/* ✅ HARD GATE: app nav does not exist until consent answered */}
                    {consentAnswered ? <RootNavigation /> : null}
                  </PremiumProvider>
                </CartProvider>
              </FavoritesProvider>
            </SettingsProvider>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>

      <TelemetryOnboardingModal visible={showConsent} onChoose={handleConsentChoice} />
    </>
  );
}
