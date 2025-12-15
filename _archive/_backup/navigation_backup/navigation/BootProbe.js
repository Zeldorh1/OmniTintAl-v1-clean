import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './AppNavigator';
import CleanTheme from '../src/theme/CleanTheme';

export default function BootProbe() {
  console.log('✅ BootProbe Mounted');
  return (
    <NavigationContainer theme={CleanTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}
