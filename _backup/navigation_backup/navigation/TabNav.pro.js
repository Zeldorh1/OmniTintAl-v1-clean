import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import HomeScreenPro from "../screens/HomeScreen.pro";
import FavoritesScreen from "../screens/FavoritesScreen";
import TrendRadarScreen from "../screens/TrendRadarScreen";
import BagScreen from "../screens/BagScreen";
import MenuPro from "../screens/Menu.pro";

const Tab = createBottomTabNavigator();

export default function TabNavPro() {
  const [pulseEnabled, setPulseEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("tabPulse");
      if (saved !== null && JSON.parse(saved) === true) {
        setPulseEnabled(true);
      }
    })();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const iconAnim = useRef(new Animated.Value(1)).current;

          useEffect(() => {
            if (focused && pulseEnabled) {
              const loop = Animated.loop(
                Animated.sequence([
                  Animated.timing(iconAnim, {
                    toValue: 1.15,
                    duration: 800,
                    useNativeDriver: true,
                  }),
                  Animated.timing(iconAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                  }),
                ])
              );
              loop.start();
              return () => loop.stop();
            }
          }, [focused, pulseEnabled]);

          const getIconName = () => {
            switch (route.name) {
              case "Home":
                return focused ? "home" : "home-outline";
              case "Favorites":
                return focused ? "heart" : "heart-outline";
              case "Trend Radar":
                return focused ? "bar-chart" : "bar-chart-outline";
              case "Bag":
                return focused ? "bag" : "bag-outline";
              case "Menu":
                return focused ? "menu" : "menu-outline";
              default:
                return "ellipse";
            }
          };

          return (
            <Animated.View style={{ transform: [{ scale: iconAnim }] }}>
              <Ionicons
                name={getIconName()}
                size={24}
                color={focused ? "#D4AF37" : "#000"}
              />
            </Animated.View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreenPro} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Trend Radar" component={TrendRadarScreen} />
      <Tab.Screen name="Bag" component={BagScreen} />
      <Tab.Screen name="Menu" component={MenuPro} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 10,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 0,
  },
});
