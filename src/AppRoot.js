// src/AppRoot.js — FINAL ROOT COMPOSITION (LAUNCH-READY)

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Font from "expo-font";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

import AppNavigator from "../navigation/AppNavigator";

// Contexts
import { AppProvider } from "./context/AppContext.pro";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";

// Background personalization / telemetry-safe brain
import BootProbe from "./BootProbe";

// Chooses light/dark nav theme based on ThemeContext
function RootNavigation() {
  const { theme } = useTheme();
  const navTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function AppRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync(Ionicons.font);
      } catch (err) {
        console.warn("Font load error:", err);
      } finally {
        setReady(true);
      }
    }
    loadResources();
  }, []);

  if (!ready) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
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
                {/* Runs nightly / periodic personalization, no UI */}
                <BootProbe />
                {/* All navigation (StartupScreen → Login → MainTabs) lives here */}
                <RootNavigation />
              </CartProvider>
            </FavoritesProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
