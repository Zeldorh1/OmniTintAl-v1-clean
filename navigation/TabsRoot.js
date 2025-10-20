// client/navigation/TabsRoot.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

import { useCart } from '@context/CartContext';

// 👉 Adjust these three imports to match your file names if needed
import HomeScreen from "../src/screens/HomeScreen.pro.js";
import FavoritesScreen from "../src/screens/Favorites.js";
import CartScreen from "../src/screens/CartScreen.js";

const Tab = createBottomTabNavigator();

/** Try to use BlurView if available; fall back to a solid surface */
const TabBg = () => {
  let BlurViewComp = null;
  try {
    BlurViewComp = require('expo-blur').BlurView;
  } catch (e) {}
  if (BlurViewComp) {
    return <BlurViewComp tint="light" intensity={30} style={StyleSheet.absoluteFill} />;
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.92)' }]} />;
};

/** Small helper so we can read cart store inside the tabBarIcon renderer */
function BagTabIcon({ color, size = 22 }) {
  const cart = useCart(); // this is the zustand hook provided via context
  const count = cart((s) => (s.items?.reduce?.((n, it) => n + (it.qty ?? 1), 0) ?? 0) + (s.bundles?.length ?? 0));

  return (
    <View>
      <FontAwesome5 name="shopping-bag" size={size} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

/** Empty component for Menu tab (we intercept tabPress to open drawer) */
const Empty = () => null;

export default function TabsRoot() {
  const nav = useNavigation();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,

        // COLORS
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#9FA4AA',

        // LABELS
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },

        // FLOATY, FROSTED TAB BAR
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Platform.OS === 'ios' ? 14 : 10,
          height: 64,
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 6,
          // soft shadow
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },

        tabBarBackground: () => <TabBg />,

        // nicer press (keeps ripple on Android)
        tabBarButton: (props) => (
          <TouchableOpacity activeOpacity={0.85} {...props} />
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="home" size={size ?? 22} color={color} />,
          tabBarLabel: 'Home',
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="heart" solid size={size ?? 22} color={color} />,
          tabBarLabel: 'Favorites',
        }}
      />

      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BagTabIcon color={color} size={size ?? 22} />,
          tabBarLabel: 'Bag',
        }}
      />

      {/* Menu tab just opens the Premium drawer (no visible screen here) */}
      <Tab.Screen
        name="Menu"
        component={Empty}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // Navigate to your Premium stack and open drawer
            // Make sure your root navigator has a route named 'Premium'
            nav.navigate('Premium', {
              screen: 'PremiumMenu',
              params: { openDrawer: true },
            });
          },
        }}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="bars" size={size ?? 22} color={color} />,
          tabBarLabel: 'Menu',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 6,
    right: 18,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
