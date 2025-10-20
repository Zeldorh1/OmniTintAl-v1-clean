import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavPro from "./TabNav.pro";

// Screens
import SettingsScreenPro from "../screens/settings/SettingsScreen.pro";
import PersonalizationSurveyScreen from "../screens/personalization/PersonalizationSurveyScreen";

// Feature placeholders (ensure these exist)
import HairHealthScannerScreen from "../screens/health/HairHealthScannerScreen";
import ARTryOnScreen from "../screens/ar/ARTryOnScreen";
import AR360PreviewScreen from "../screens/ar/AR360PreviewScreen";

const Stack = createNativeStackNavigator();

export default function RootNavPro() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavPro} />
      <Stack.Screen name="Settings" component={SettingsScreenPro} options={{ headerShown: true, title: "Settings" }} />
      <Stack.Screen name="PersonalizationSurvey" component={PersonalizationSurveyScreen} options={{ headerShown: true, title: "Personalization" }} />
      <Stack.Screen name="HairHealthScanner" component={HairHealthScannerScreen} options={{ headerShown: true, title: "Hair Health Scanner" }} />
      <Stack.Screen name="ARTryOn" component={ARTryOnScreen} options={{ headerShown: true, title: "AR Try-On Studio" }} />
      <Stack.Screen name="AR360Preview" component={AR360PreviewScreen} options={{ headerShown: true, title: "360° Preview Studio" }} />
    </Stack.Navigator>
  );
}
