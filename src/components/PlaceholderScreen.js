// src/components/PlaceholderScreen.js — FIXED

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';  // ✔️ Correct import

export default function PlaceholderScreen({ title = 'Screen' }) {
  const { colors } = useTheme(); // ✔️ Correct usage

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>
        {title}
      </Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>
        Wire this to your actual screen file.
      </Text>
    </View>
  );
}
