import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

const ThemeContext = createContext(null);
const STORE = "@omnitintai:theme";

export const ThemeProvider = ({ children }) => {
  const sys = Appearance.getColorScheme() || "light";
  const [mode, setModeState] = useState(sys);
  const [accent, setAccentState] = useState("#FDAE5F"); // gold

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE);
        if (raw) {
          const { mode: m, accent: a } = JSON.parse(raw);
          if (m) setModeState(m);
          if (a) setAccentState(a);
        }
      } catch {}
    })();
  }, []);

  const theme = useMemo(() => {
    const isDark = mode === "dark";
    return {
      mode,
      colors: {
        text: isDark ? "#FFFFFF" : "#000000",
        background: isDark ? "#000000" : "#FFFFFF",
        card: isDark ? "#111111" : "#FFFFFF",
        mute: isDark ? "rgba(255,255,255,0.6)" : "#777777",
        accent,                 // gold
        divider: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)",
        tabBg: "#FFFFFF",
        iconActive: accent,
        iconInactive: isDark ? "rgba(255,255,255,0.7)" : "#888888",
      },
      gradients: {
        brand: isDark ? ["#2a2a2a", "#111111"] : [accent, "#FDC875"],
      },
    };
  }, [mode, accent]);

  const persist = async (next) => {
    try {
      await AsyncStorage.setItem(STORE, JSON.stringify({ mode, accent, ...next }));
    } catch {}
  };
  const setMode = (m) => { setModeState(m); persist({ mode: m }); };
  const setAccent = (a) => { setAccentState(a); persist({ accent: a }); };

  return (
    <ThemeContext.Provider value={{ ...theme, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemePro = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePro must be used inside ThemeProvider");
  return ctx;
};
