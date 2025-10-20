import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Font from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NavigationContainer } from "@react-navigation/native";

// ✅ Matches your current folder layout
import AppNavigator from "./navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import { AppProvider } from "./src/context/AppContext.pro";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
        });
        console.log("✅ Fonts loaded successfully");
        setReady(true);
      } catch (err) {
        console.warn("⚠️ Error loading fonts:", err);
      }
    }

    loadResources();
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
    </ThemeProvider>
  );
}
