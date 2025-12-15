// src/screens/StartupScreen.js — FINAL FLAGSHIP STARTUP

import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import { Video } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function StartupScreen() {
  const nav = useNavigation();
  const videoRef = useRef(null);

  const { user, initializing } = useAuth();
  const { settings } = useSettings();
  const showIntro = settings?.showIntroOnLaunch ?? true;

  const goNext = useCallback(() => {
    const isSignedIn = !!user;
    nav.reset({
      index: 0,
      routes: [{ name: isSignedIn ? 'MainTabs' : 'Login' }],
    });
  }, [nav, user]);

  useEffect(() => {
    if (initializing) return; // wait for Firebase to resolve user

    if (!showIntro) {
      goNext();
      return;
    }

    const timer = setTimeout(goNext, 3200); // just over the video length
    return () => clearTimeout(timer);
  }, [initializing, showIntro, goNext]);

  const handleTap = () => {
    // Tap anywhere → skip intro immediately
    goNext();
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Background video */}
        <Video
          ref={videoRef}
          source={require('../../assets/HairAppStartup.mp4')}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={showIntro}
          isLooping={false}
        />

        {/* Overlay logo + tagline */}
        <View style={styles.overlay}>
          <Text style={styles.logoText}>
            OmniTintAI<Text style={styles.registered}>®</Text>
          </Text>
          <Text style={styles.tagline}>Where hair meets intelligence.</Text>
          <Text style={styles.hint}>Tap anywhere to skip</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // fallback if video fails
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  registered: {
    fontSize: 16,
    verticalAlign: 'top',
  },
  tagline: {
    marginTop: 10,
    color: '#E5E7EB',
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    color: '#9CA3AF',
    fontSize: 12,
  },
});
