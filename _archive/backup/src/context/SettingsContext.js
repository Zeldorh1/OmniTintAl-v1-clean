// src/context/SettingsContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const KEY = 'omni_settings_v1';

const defaultSettings = {
  // Privacy / features
  voiceWakeEnabled: true,            // “Hey Omni / OmniTint”
  microphoneEnabled: true,           // tap-to-mic
  shareAnonymizedStats: true,       // stays ON by default
// add a default
showIntroOnLaunch: true,
  // Security
  biometricLock: false,              // ask for biometrics on app resume
  permissions: { camera: null, notifications: null }, // null | 'granted' | 'denied'

  // Notifications
  notificationsEnabled: false,

  // Display / theme
  theme: 'light',                    // 'light' | 'dark'
  backgroundColor: '#FFFFFF',        // user-chosen app background

  // Language
  language: 'auto',                  // 'auto' | 'en' | 'es' | ...

  // Account (purely local placeholder until you hook auth)
  account: {
    signedIn: false,
    userId: null,
    email: null,
  },
};

const SettingsContext = createContext({
  settings: defaultSettings,
  update: (_patch) => {},
  resetAll: async () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(settings));
  }, [loaded, settings]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const resetAll = async () => {
    setSettings(defaultSettings);
    await AsyncStorage.setItem(KEY, JSON.stringify(defaultSettings));
  };

  const value = useMemo(() => ({ settings, update, resetAll }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

// Helper: resolve language code
export function resolveLanguage(settings) {
  if (settings.language !== 'auto') return settings.language;
  // Use the first preferred locale from the device, e.g., "en-US" -> "en"
  return (Localization.locale || 'en').split('-')[0];
}
