
import React from 'react';
import { View, Text } from 'react-native';
import { useThemePro } from '../context/ProThemeContext';

export default function PlaceholderScreen({ title = 'Screen' }) {
  const theme = useThemePro();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '600' }}>{title}</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 8 }}>Wire this to your actual screen file.</Text>
    </View>
  );
}
