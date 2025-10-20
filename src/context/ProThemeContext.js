
import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { colors, gradients, typography } from '../theme/proTheme';

/**
 * Pro Theme Context
 * - Auto-respects system dark mode, with manual override via prefs.theme
 * - Provides design tokens to any component
 */
const ThemeContext = createContext(null);

export function ProThemeProvider({ mode = 'auto', children }) {
  const [system, setSystem] = useState(Appearance.getColorScheme() || 'light');
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme || 'light'));
    return () => sub && sub.remove && sub.remove();
  }, []);

  const resolvedMode = mode === 'auto' ? system : mode;
  const theme = useMemo(() => ({
    mode: resolvedMode,
    colors: colors[resolvedMode],
    gradients,
    typography
  }), [resolvedMode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemePro() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePro must be used inside <ProThemeProvider />');
  return ctx;
}
