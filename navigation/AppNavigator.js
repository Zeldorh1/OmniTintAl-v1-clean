// client/navigation/AppNavigator.js — FINAL (no duplicate Premium stack)

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StartupScreen from "../src/screens/StartupScreen";
import LoginScreen from "../src/screens/LoginScreen";
import MainTabs from "./MainTabs";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Startup" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Startup" component={StartupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}
