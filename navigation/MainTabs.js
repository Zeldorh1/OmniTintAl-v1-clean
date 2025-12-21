// client/navigation/MainTabs.js — FINAL (Home · Favorites · Bag · Menu overlay)

import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../src/screens/HomeScreenPro";
import FavoritesScreen from "../src/screens/Favorites";
import CartScreen from "../src/screens/CartScreen"; // ✅ Bag screen (you have it)
import { Icon } from "../src/components/Icons";

const Tab = createBottomTabNavigator();

function NullScreen() {
  return null;
}

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

      {/* ✅ BAG tab */}
      <Tab.Screen
        name="Bag"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ paddingTop: 6 }}>
              <Icon name="bag" size={24} color={focused ? "#FFD700" : "#888"} />
            </View>
          ),
        }}
      />

      {/* ✅ Hamburger opens PremiumMenu overlay (ONLY premium entry point) */}
      <Tab.Screen
        name="Menu"
        component={NullScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ paddingTop: 6 }}>
              <Icon name="menu" size={26} color={focused ? "#FFD700" : "#888"} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate("PremiumMenu"); // ✅ opens overlay modal in AppNavigator
          },
        })}
      />
    </Tab.Navigator>
  );
}
