import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../src/screens/LoginScreen";
import MainTabs from "./MainTabs";

import PremiumNavigator from "./PremiumNavigator";
import PremiumMenu from "../src/screens/premium/PremiumMenu";

import PersonalizationSurveyScreen from "../src/screens/personalization/PersonalizationSurveyScreen";

import SettingsScreen from "../src/screens/premium/SettingsScreen";
import CategoryViewScreen from "../src/screens/CategoryViewScreen";
import ProductDetailsScreen from "../src/screens/ProductDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />

      <Stack.Screen name="Premium" component={PremiumNavigator} />

      <Stack.Screen
        name="PremiumMenu"
        component={PremiumMenu}
        options={{
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />

      <Stack.Screen
        name="PersonalizationSurvey"
        component={PersonalizationSurveyScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      {/* optional aliases */}
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="CategoryView" component={CategoryViewScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
}
