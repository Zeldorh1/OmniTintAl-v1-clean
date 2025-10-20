import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from "../screens/HomeScreen.pro.js";
import FavoritesScreen from "../screens/Favorites.js";
import PremiumNavigator from './PremiumNavigator';
import MenuScreen from '../screens/MenuScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          height: 65,
          paddingBottom: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          size = 26;
          color = focused ? '#FFD700' : '#888';

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Premium') iconName = focused ? 'diamond' : 'diamond-outline';
          else if (route.name === 'Menu') iconName = 'menu';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Premium" component={PremiumNavigator} /> {/* <- Nested */}
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}
