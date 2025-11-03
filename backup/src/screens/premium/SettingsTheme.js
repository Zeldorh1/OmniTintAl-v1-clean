import React from 'react';
import { View, Text, SafeAreaView, Switch } from 'react-native';
import d from '../../theme/designs'; // ✅ now works since alias is configured
import { useThemeFlags } from '@context/ThemeContext'; // ✅ clean alias import

export default function SettingsTheme() {
  const { colorfulBg, setColorfulBg } = useThemeFlags();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: d.colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={[d.fonts.h1, { marginBottom: 16, color: d.colors.card }]}>
          Appearance
        </Text>

        <View
          style={{
            backgroundColor: d.colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: d.colors.muted,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontWeight: '700', color: d.colors.bg }}>
              Colorful Backgrounds
            </Text>
            <Switch
              value={colorfulBg}
              onValueChange={setColorfulBg}
              thumbColor={colorfulBg ? '#f87171' : '#f4f3f4'}
              trackColor={{ false: '#767577', true: '#fca5a5' }}
            />
          </View>

          <Text
            style={{
              marginTop: 8,
              color: d.colors.muted,
              fontSize: 14,
            }}
          >
            Keep it off for crisp black & white. Toggle on for pink gradient 🌈
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
