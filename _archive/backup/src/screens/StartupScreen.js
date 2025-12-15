// src/screens/StartupScreen.js
import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video } from 'expo-av'; // Using expo-av; fine even if it logs a deprecation notice
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';

export default function StartupScreen() {
  const nav = useNavigation();
  const { settings } = useSettings();
  const signedIn = !!settings?.account?.signedIn;
  const showIntro = settings?.showIntroOnLaunch ?? true;
  const videoRef = useRef(null);

  const goNext = useCallback(() => {
    // If somehow we landed here signed-out, go to Login; else go to tabs.
    nav.reset({
      index: 0,
      routes: [{ name: signedIn ? 'MainTabs' : 'Login' }],
    });
  }, [nav, signedIn]);

  useEffect(() => {
    // Guard: never show intro if signed-out or user disabled it
    if (!signedIn || !showIntro) {
      goNext();
      return;
    }

    // Minimal display time: 2s
    const t = setTimeout(goNext, 2000);
    return () => clearTimeout(t);
  }, [signedIn, showIntro, goNext]);

  return (
    <TouchableWithoutFeedback onPress={goNext}>
      <View style={s.container}>
        <StatusBar style="light" translucent />
        <Video
          ref={videoRef}
          source={require('../../assets/HairAppStartup.mp4')}
          style={s.video}
          resizeMode="cover"
          shouldPlay
          isMuted
          isLooping={false}
          onError={(e) => console.log('[Startup] video error', e)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
});
