import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PremiumMenu from "../src/screens/premium/PremiumMenu";
import ARStudio from "../src/screens/premium/ARStudio.real";
import AR360PreviewScreen from "../src/screens/premium/AR360PreviewScreen.real";
import HairHealthScannerScreen from "../src/screens/premium/HairHealthScannerScreen";
import HairMixerScreen from "../src/screens/premium/HairMixerScreen.real";
import CompareProductsScreen from "../src/screens/premium/CompareProductsScreen";
import TrendRadarScreen from "../src/screens/premium/TrendRadarScreen";
import AIChatScreen from "../src/screens/premium/AIChatScreen";
import ProgressTrackerScreen from "../src/screens/premium/ProgressTrackerScreen";
import SettingsScreen from "../src/screens/premium/SettingsScreen";
import AIStylesScreen from "../src/screens/premium/AIStylesScreen";
import HairScanResultDynamic from "../src/screens/premium/HairScanResultDynamic";
import HairHealthResultGood from "../src/screens/premium/HairHealthResultGood";
import HairHealthResultRecovery from "../src/screens/premium/HairHealthResultRecovery";

const Stack = createNativeStackNavigator();

export default function PremiumNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="PremiumMenu"
    >
      {/* Menu */}
      <Stack.Screen name="PremiumMenu" component={PremiumMenu} />

      {/* Main Premium Features */}
      <Stack.Screen name="ARStudio" component={ARStudio} />
      <Stack.Screen name="AR360PreviewScreen" component={AR360PreviewScreen} />
      <Stack.Screen
        name="HairHealthScannerScreen"
        component={HairHealthScannerScreen}
      />
      <Stack.Screen name="HairMixerScreen" component={HairMixerScreen} />
      <Stack.Screen
        name="CompareProductsScreen"
        component={CompareProductsScreen}
      />
      <Stack.Screen name="TrendRadarScreen" component={TrendRadarScreen} />
      <Stack.Screen name="AIChatScreen" component={AIChatScreen} />
      <Stack.Screen
        name="ProgressTrackerScreen"
        component={ProgressTrackerScreen}
      />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="AIStylesScreen" component={AIStylesScreen} />

      {/* Result Views */}
      <Stack.Screen
        name="HairScanResultDynamic"
        component={HairScanResultDynamic}
      />
      <Stack.Screen
        name="HairHealthResultGood"
        component={HairHealthResultGood}
      />
      <Stack.Screen
        name="HairHealthResultRecovery"
        component={HairHealthResultRecovery}
      />
    </Stack.Navigator>
  );
}
