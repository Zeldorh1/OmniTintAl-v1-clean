// client/navigation/MainTabs.js — FINAL (SVG/Icon system, single hamburger)

import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../src/screens/HomeScreenPro";
import FavoritesScreen from "../src/screens/Favorites";
import PremiumNavigator from "./PremiumNavigator";
import MenuScreen from "../src/screens/MenuScreen";

import { Icon } from "../src/components/Icons"; // ✅ your icon system

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#111",
          height: 64,
          paddingBottom: 10,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ paddingTop: 6 }}>
              <Icon name="home" size={24} color={focused ? "#FFD700" : "#888"} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ paddingTop: 6 }}>
              <Icon name="heart" size={24} color={focused ? "#FFD700" : "#888"} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Premium"
        component={PremiumNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ paddingTop: 6 }}>
              <Icon name="gem" size={24} color={focused ? "#FFD700" : "#888"} />
            </View>
          ),
        }}
      />

      {/* ✅ SINGLE hamburger menu — opens the PremiumMenu drawer */}
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ paddingTop: 6 }}>
              <Icon name="menu" size={26} color={focused ? "#FFD700" : "#888"} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
