// client/src/AppRoot.js  — DROP-IN (adds PremiumProvider correctly)

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import AppNavigator from '../navigation/AppNavigator';

import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';

// ✅ NEW: Premium gate provider (required for usePremium)
import { PremiumProvider } from './context/PremiumContext';

import BootProbe from './BootProbe';

function RootNavigation() {
  const t = useTheme();
  const navTheme = t.mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function AppRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await Font.loadAsync(Ionicons.font);
      } catch (e) {
        console.warn('Font load error', e);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider>
          <SettingsProvider>
            <FavoritesProvider>
              <CartProvider>

                {/* ✅ NEW: wraps BootProbe + Navigation so premium hooks never crash */}
                <PremiumProvider>
                  <BootProbe />
                  <RootNavigation />
                </PremiumProvider>

              </CartProvider>
            </FavoritesProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}

