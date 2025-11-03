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

export default function App() {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />

      {/* Everything must be inside CartProvider to access useCart */}
      <SettingsProvider>
        <FavoritesProvider>
          <CartProvider>
            <NavigationContainer theme={navTheme}>
              <BootProbe />
              <AppNavigator />
            </NavigationContainer>
          </CartProvider>
        </FavoritesProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
