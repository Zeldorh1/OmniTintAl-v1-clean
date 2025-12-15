// src/screens/StartupScreen.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';

export default function StartupScreen() {
  const nav = useNavigation<any>();
  const { settings } = useSettings();
  const signedIn = !!settings?.account?.signedIn;
  const showIntro = settings?.showIntroOnLaunch ?? true;

  const goNext = useCallback(() => {
    nav.reset({
      index: 0,
      routes: [{ name: signedIn ? 'MainTabs' : 'Login' }],
    });
  }, [nav, signedIn]);

  useEffect(() => {
    if (!signedIn || !showIntro) {
      goNext();
      return;
    }
    const timer = setTimeout(goNext, 2000);
    return () => clearTimeout(timer);
  }, [signedIn, showIntro, goNext]);

  return (
    <TouchableWithoutFeedback onPress={goNext}>
      <View style={s.container}>
        <StatusBar style="light" translucent />
        <Text style={s.loadingText}>Loading OmniTintAI...</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
