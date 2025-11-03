import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../src/screens/LoginScreen.js";
import StartupScreen from "../src/screens/StartupScreen.js";
import TabsRoot from "./TabsRoot";
import PremiumNavigator from "./PremiumNavigator";
import { useSettings } from "../src/context/SettingsContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const settings = useSettings();
  const signedIn = settings?.account?.signedIn;
  const showIntro = settings?.showIntroOnLaunch ?? true;

  // ✅ Logic: decide where the app should start
  const initialRoute =
    signedIn && !showIntro ? "MainTabs" : showIntro ? "Startup" : "Login";

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      {/* Startup animation */}
      <Stack.Screen name="Startup" component={StartupScreen} />
      
      {/* Login */}
      <Stack.Screen name="Login" component={LoginScreen} />
      
      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={TabsRoot} />
      
      {/* Premium Section */}
      <Stack.Screen name="Premium" component={PremiumNavigator} />
    </Stack.Navigator>
  );
}
