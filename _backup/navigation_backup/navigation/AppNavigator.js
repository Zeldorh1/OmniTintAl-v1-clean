// client/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../src/screens/LoginScreen';
import TabsRoot from './TabsRoot';
import PremiumNavigator from './PremiumNavigator';
import StartupScreen from '../src/screens/StartupScreen';
import { useSettings } from '../src/context/SettingsContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { settings } = useSettings();
  const signedIn = !!settings?.account?.signedIn;
  const wantIntro = settings?.showIntroOnLaunch ?? true;

  // Only use Startup when already signed in AND intro is enabled
  const initialRoute = signedIn
    ? (wantIntro ? 'Startup' : 'MainTabs')
    : 'Login';

  return (
    <Stack.Navigator
      key={`auth:${signedIn}|intro:${wantIntro ? 1 : 0}`}
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      {/* Startup appears only if initialRoute === 'Startup' */}
      <Stack.Screen name="Startup" component={StartupScreen} />

      {/* Login appears only if initialRoute === 'Login' */}
      {!signedIn && <Stack.Screen name="Login" component={LoginScreen} />}

      {/* Main tabs (home/favorites/bag/menu) */}
      <Stack.Screen name="MainTabs" component={TabsRoot} />

      {/* Premium stack (needed for the slide-out menu route) */}
      <Stack.Screen name="Premium" component={PremiumNavigator} />
    </Stack.Navigator>
  );
}
