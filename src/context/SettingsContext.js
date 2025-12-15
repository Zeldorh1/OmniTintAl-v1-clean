// src/context/SettingsContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const KEY = 'omni_settings_v1';

// Global app settings (launch, theme, permissions, account, etc.)
const defaultSettings = {
  // Primary features
  voiceWakeEnabled: true,      // "Hey Omni / OmniTint"
  microphoneEnabled: true,     // tap-to-mic
  shareAnonymizedStats: true,  // stays ON by default
  showIntroOnLaunch: true,

  // Security
  biometricLock: false,        // ask for biometrics on app resume
  permissions: {
    camera: null,              // 'granted' | 'denied' | null
    notifications: null,
  },

  // Notifications
  notificationsEnabled: false,

  // Display / theme
  theme: 'light',              // 'light' | 'dark'
  backgroundColor: '#FFFFFF',  // user-chosen app background

  // Language
  language: 'auto',            // 'auto' | 'en' | 'es' | ...

  // Account (local placeholder until you hook auth)
  account: {
    signedIn: false,
    email: null,
    isPremium: false,          // 👈 added so the rest of the app can safely read this
  },
};

const SettingsContext = createContext({
  ...defaultSettings,
  settings: defaultSettings,
  update: (_patch) => {},
  resetAll: async () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // Load once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({
            ...prev,
            ...parsed,
            account: { ...prev.account, ...(parsed.account || {}) },
            permissions: { ...prev.permissions, ...(parsed.permissions || {}) },
          }));
        }
      } catch (e) {
        console.warn('Settings load error:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Save whenever settings change (after load)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch((e) =>
      console.warn('Settings save error:', e)
    );
  }, [settings, loaded]);

  const update = (patch) => {
    setSettings((s) => ({
      ...s,
      ...patch,
      account: { ...s.account, ...(patch.account || {}) },
      permissions: { ...s.permissions, ...(patch.permissions || {}) },
    }));
  };

  const resetAll = async () => {
    setSettings(defaultSettings);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(defaultSettings));
    } catch (e) {
      console.warn('Settings reset error:', e);
    }
  };

  const value = useMemo(
    () => ({
      ...settings,      // legacy: useSettings().theme, etc.
      settings,         // new: const { settings, update } = useSettings()
      update,
      resetAll,
    }),
    [settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);

// Helper: resolve language code (keeps your original helper)
export function resolveLanguage(settings) {
  if (settings.language !== 'auto') return settings.language;
  // Use the first preferred locale from the device, e.g. "en-US" -> "en"
  return (Localization.locale || 'en').split('-')[0];
}
