// client/src/context/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, NativeModules, Platform } from 'react-native';

type ThemeCtx = {
  mode: 'light' | 'dark';
  lang: string;
  autoLang: boolean;
  accent: string;

  setMode: (m: 'light' | 'dark') => void;
  setAccent: (c: string) => void;
  setLang: (l: string) => void;
  setAutoLang: (b: boolean) => void;

  /** Hearts independent of header/accent */
  heartColor: string;
  setHeartColor: (c: string) => void;

  colors: {
    text: string;
    background: string;
    card: string;
    mute: string;
    accent: string;
    divider: string;
    tabBg: string;
    iconActive: string;
    iconInactive: string;
    heart: string; // use this everywhere for hearts
  };

  gradients: {
    /** header gradient uses accent dynamically; default orange→yellow */
    brand: [string, string];
  };
};

const ThemeContext = createContext<ThemeCtx | null>(null);
const STORE = '@omnitintai:settings';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemMode = Appearance.getColorScheme() || 'light';
  const [mode, setModeState] = useState<'light' | 'dark'>(systemMode as any);
  const [accent, setAccentState] = useState('#FDAE5F'); // default header/accent
  const [heartColor, setHeartColorState] = useState('#E53935'); // default red
  const [lang, setLangState] = useState('en');
  const [autoLang, setAutoLangState] = useState(true);

  const getSystemLanguage = () => {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    const code = locale?.split('-')[0]?.split('_')[0];
    return code || 'en';
  };

  // ────── LOAD FROM STORAGE ──────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.mode) setModeState(saved.mode);
          if (saved.accent) setAccentState(saved.accent);
          if (saved.heartColor) setHeartColorState(saved.heartColor);
          if (saved.lang !== undefined) setLangState(saved.lang);
          if (saved.autoLang !== undefined) setAutoLangState(saved.autoLang);
        } else {
          setLangState(getSystemLanguage());
        }
      } catch (e) {
        console.warn('Failed to load theme settings', e);
      }
    })();
  }, []);

  // ────── AUTO-LANG SYNC ──────
  useEffect(() => {
    if (autoLang) setLangState(getSystemLanguage());
  }, [autoLang]);

  // ────── PERSIST TO STORAGE ──────
  const persist = async (
    updates: Partial<{
      mode: 'light' | 'dark';
      accent: string;
      heartColor: string;
      lang: string;
      autoLang: boolean;
    }>,
  ) => {
    try {
      const current = { mode, accent, heartColor, lang, autoLang };
      await AsyncStorage.setItem(STORE, JSON.stringify({ ...current, ...updates }));
    } catch (e) {
      console.warn('Failed to save theme settings', e);
    }
  };

  const setMode = (m: 'light' | 'dark') => {
    setModeState(m);
    persist({ mode: m });
  };
  const setAccent = (a: string) => {
    setAccentState(a);
    persist({ accent: a });
  };
  const setLang = (l: string) => {
    setLangState(l);
    persist({ lang: l });
  };
  const setAutoLang = (b: boolean) => {
    setAutoLangState(b);
    persist({ autoLang: b });
  };
  const setHeartColor = (c: string) => {
    setHeartColorState(c);
    persist({ heartColor: c });
  };

  const isDark = mode === 'dark';

  const ctx = useMemo<ThemeCtx>(
    () => ({
      mode,
      lang,
      autoLang,
      accent,
      setMode,
      setAccent,
      setLang,
      setAutoLang,
      heartColor,
      setHeartColor,
      colors: {
        text: isDark ? '#FFFFFF' : '#000000',
        background: isDark ? '#000000' : '#FFFFFF',
        card: isDark ? '#111111' : '#FFFFFF',
        mute: isDark ? 'rgba(255,255,255,0.6)' : '#777777',
        accent,
        divider: isDark
          ? 'rgba(255,255,255,0.15)'
          : 'rgba(0,0,0,0.10)',
        tabBg: '#FFFFFF',
        iconActive: accent,
        iconInactive: isDark ? 'rgba(255,255,255,0.7)' : '#888888',
        heart: heartColor || '#E53935',
      },
      gradients: {
        brand: [accent || '#FDAE5F', '#FDC875'],
      },
    }),
    [mode, lang, autoLang, accent, heartColor, isDark],
  );

  return (
    <ThemeContext.Provider value={ctx}>
      {children}
    </ThemeContext.Provider>
  );
};

// Main hook used by navigation + most screens
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

// Alias to keep older code working (if anything still imports useThemePro)
export const useThemePro = useTheme;
