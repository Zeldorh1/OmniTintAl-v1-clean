// client/App.js
import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { SettingsProvider } from './src/context/SettingsContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { CartProvider } from './src/context/CartContext';

import AppNavigator from './navigation/AppNavigator';
import BootProbe from './src/bootProbe';

// Optional: you can adjust background here if needed
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />

      {/* Settings controls app theme & telemetry toggles */}
      <SettingsProvider>
        {/* Favorites + Cart must wrap navigation */}
        <FavoritesProvider>
          <CartProvider>
            <NavigationContainer theme={navTheme}>
              {/* BootProbe plays intro + triggers nightly learning jobs */}
              <BootProbe />
              <AppNavigator />
            </NavigationContainer>
          </CartProvider>
        </FavoritesProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
