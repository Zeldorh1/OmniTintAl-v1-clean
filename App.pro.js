import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppNavigator from './navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext.pro';
import { ThemeProvider } from './src/context/ThemeContext';
import { CartProvider } from './src/context/CartContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync(Ionicons.font);
        console.log("✅ Fonts loaded successfully!");
        setReady(true);
      } catch (err) {
        console.warn("⚠️ Error loading fonts:", err);
      }
    }
    loadResources();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <AppProvider>
      <ThemeProvider>
        <SettingsProvider>
          <FavoritesProvider>
            <CartProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </CartProvider>
          </FavoritesProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AppProvider>
  );
}
