// client/navigation/AppNavigator.js — FINAL (Login -> MainTabs + Premium stack + PremiumMenu overlay)

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../src/screens/LoginScreen";
import MainTabs from "./MainTabs";

// ✅ bring Premium stack into the root so its routes can be reached
import PremiumNavigator from "./PremiumNavigator";

// ✅ Premium overlay menu (same UI, just correct presentation)
import PremiumMenu from "../src/screens/premium/PremiumMenu";

// ✅ global aliases (optional but fine to keep)
import SettingsScreen from "../src/screens/premium/SettingsScreen";
import CategoryViewScreen from "../src/screens/CategoryViewScreen";
import ProductDetailsScreen from "../src/screens/ProductDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* ✅ Root-level Premium stack */}
      <Stack.Screen name="Premium" component={PremiumNavigator} />

      {/* ✅ Root-level overlay menu (transparent modal on top of current screen) */}
      <Stack.Screen
        name="PremiumMenu"
        component={PremiumMenu}
        options={{
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />

      {/* optional aliases */}
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="CategoryView" component={CategoryViewScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
}
