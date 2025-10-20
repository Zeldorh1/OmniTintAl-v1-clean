// client/navigation/PremiumNavigator.js
import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ==================== Premium Screens ====================
import PremiumMenu from '../src/screens/premium/PremiumMenu';
import ARStudio from '../src/screens/premium/ARStudio';
import AR360PreviewScreen from '../src/screens/premium/AR360PreviewScreen';
import HairHealthScannerScreen from '../src/screens/premium/HairHealthScannerScreen';
import HairMixerScreen from '../src/screens/premium/HairMixerScreen';
import CompareProductsScreen from '../src/screens/premium/CompareProductsScreen';
import TrendRadarScreen from '../src/screens/premium/TrendRadarScreen';
import AIChatScreen from '../src/screens/premium/AIChatScreen';
import ProgressTrackerScreen from '../src/screens/premium/ProgressTrackerScreen';
import SettingsScreen from '../src/screens/premium/SettingsScreen';
import AIStylesScreen from '../src/screens/premium/AIStylesScreen';

// ==================== NEW: Dynamic Result Screen ====================
import HairScanResultDynamic from '../src/screens/premium/HairScanResultDynamic';

// Optional: keep Good/Recovery for now
import HairScanResultGood from '../src/screens/premium/HairHealthResultGood';
import HairScanResultRecovery from '../src/screens/premium/HairHealthResultRecovery';

// ==========================================================
const Stack = createNativeStackNavigator();
const W = Dimensions.get('window').width;

export default function PremiumNavigator({ route, navigation }) {
  const initialScreen = route?.params?.initialScreen || 'PremiumMenu';

  useEffect(() => {
    if (route?.params?.openDrawer) {
      // keep your existing drawer logic consistent
      navigation.setParams?.({ openDrawer: false });
    }
  }, [route?.params?.openDrawer]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName={initialScreen}
    >

      {/* ================= MENU ================= */}
      <Stack.Screen name="PremiumMenu" component={PremiumMenu} />

      {/* ================= FEATURE STACK ================= */}
      <Stack.Screen name="ARStudio" component={ARStudio} />
      <Stack.Screen name="AR360PreviewScreen" component={AR360PreviewScreen} />
      <Stack.Screen name="HairHealthScannerScreen" component={HairHealthScannerScreen} />
      <Stack.Screen name="HairMixerScreen" component={HairMixerScreen} />
      <Stack.Screen name="CompareProductsScreen" component={CompareProductsScreen} />
      <Stack.Screen name="TrendRadarScreen" component={TrendRadarScreen} />
      <Stack.Screen name="AIChatScreen" component={AIChatScreen} />
      <Stack.Screen name="ProgressTrackerScreen" component={ProgressTrackerScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="AIStylesScreen" component={AIStylesScreen} />

      {/* ================= RESULT SCREENS ================= */}
      <Stack.Screen name="HairScanResultGood" component={HairScanResultGood} />
      <Stack.Screen name="HairScanResultRecovery" component={HairScanResultRecovery} />
      <Stack.Screen name="HairScanResultDynamic" component={HairScanResultDynamic} />

    </Stack.Navigator>
  );
}
