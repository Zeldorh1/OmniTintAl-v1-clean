// client/src/AppRoot.js — FINAL (Font + SQLite event store init + Providers + BootProbe safe)

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

// ✅ NEW: SQLite event store init
import { initEventDB } from "./storage/omniEventStore";

function RootNavigation() {
  const t = useTheme();
  const navTheme = t.mode === "dark" ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function AppRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Load icon fonts (if you’re using @expo/vector-icons)
        await Font.loadAsync(Ionicons.font);

        // 2) Init SQLite event store ONCE (idempotent)
        await initEventDB();
      } catch (e) {
        console.warn("[AppRoot] init error:", e);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider>
          <SettingsProvider>
            <FavoritesProvider>
              <CartProvider>
                <PremiumProvider>
                  {/* ✅ BootProbe should NOT render another navigation tree.
                      If BootProbe renders UI, it should RETURN either fallback UI OR children.
                      If it’s side-effects only, it can stay here harmlessly. */}
                  <BootProbe />
                  <RootNavigation />
                </PremiumProvider>
              </CartProvider>
            </FavoritesProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
