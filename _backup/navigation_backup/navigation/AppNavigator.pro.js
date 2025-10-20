
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNav from './TabNav.pro';
import DrawerMenu from '../navigation/DrawerMenu.pro';
import { useThemePro } from '../context/ProThemeContext';

const Stack = createNativeStackNavigator();

export default function AppNavigatorPro() {
  const theme = useThemePro();
  const navTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={DrawerMenu} />
        {/* Add additional stack screens here if needed (e.g., StyleDetail, Upgrade, etc.) */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
