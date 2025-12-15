// client/navigation/PremiumNavigator.js — FINAL FLAGSHIP (stable routes)

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PremiumMenu from "../src/screens/premium/PremiumMenu";
import ARStudioMainV2 from "../src/screens/premium/ARStudioMainV2";
import AR360PreviewScreen from "../src/screens/premium/AR360PreviewScreen";
import CompareProductsScreen from "../src/screens/premium/CompareProductsScreen";
import HairHealthScannerScreen from "../src/screens/premium/HairHealthScannerScreen";
import HairScanResultDynamic from "../src/screens/premium/HairScanResultDynamic";
import HairMixerPro from "../src/screens/premium/HairMixerPro";
import ProductBundle from "../src/screens/premium/ProductBundle";
import ProgressTrackerScreen from "../src/screens/premium/ProgressTrackerScreen";
import SettingsScreen from "../src/screens/premium/SettingsScreen";
import TrendRadar from "../src/screens/premium/TrendRadar";
import AIChatScreen from "../src/screens/premium/AIChatScreen";
import AIStylesScreen from "../src/screens/premium/AIStylesScreen";
import PhotoPreviewScreen from "../src/screens/premium/PhotoPreviewScreen";
import PremiumGateScreen from "../src/screens/premium/PremiumGateScreen";

// shared (if you use them from premium flow)
import CategoryViewScreen from "../src/screens/CategoryViewScreen";
import ProductDetailsScreen from "../src/screens/ProductDetailsScreen";

const Stack = createNativeStackNavigator();

export default function PremiumNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      initialRouteName="PremiumMenu"
    >
      <Stack.Screen name="PremiumMenu" component={PremiumMenu} />

      <Stack.Screen name="ARStudioMainV2" component={ARStudioMainV2} />
      <Stack.Screen name="AR360PreviewScreen" component={AR360PreviewScreen} />

      <Stack.Screen name="HairHealthScannerScreen" component={HairHealthScannerScreen} />
      <Stack.Screen name="HairScanResultDynamic" component={HairScanResultDynamic} />

      <Stack.Screen name="ProductBundle" component={ProductBundle} />
      <Stack.Screen name="CompareProductsScreen" component={CompareProductsScreen} />

      <Stack.Screen name="TrendRadar" component={TrendRadar} />

      <Stack.Screen name="HairMixerPro" component={HairMixerPro} />
      <Stack.Screen name="AIChatScreen" component={AIChatScreen} />
      <Stack.Screen name="AIStylesScreen" component={AIStylesScreen} />

      <Stack.Screen name="ProgressTrackerScreen" component={ProgressTrackerScreen} />
      <Stack.Screen name="PhotoPreviewScreen" component={PhotoPreviewScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />

      {/* shared */}
      <Stack.Screen name="CategoryView" component={CategoryViewScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />

      {/* lock gate */}
      <Stack.Screen name="PremiumGate" component={PremiumGateScreen} />
    </Stack.Navigator>
  );
}
