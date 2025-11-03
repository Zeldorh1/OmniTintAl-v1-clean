// client/BootProbe.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { maybeNightlyTasks } from '../src/utils/personalizer.sync';

// Your existing StartupScreen (video)
import StartupScreen from '../screens/StartupScreen';

// Serve your global weights from desktop server / GitHub Pages, etc.
const GLOBAL_URL = 'https://<your-stable-host>/model/global_personalizer_v1.json';

export default function BootProbe() {
  const { settings } = useSettings();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // run daily maintenance + (optional) global weights blend
    maybeNightlyTasks({
      allowTelemetry: settings?.shareAnonymizedStats,
      globalUrl: GLOBAL_URL || null,
    });
  }, [settings?.shareAnonymizedStats]);

  useEffect(() => {
    // Intro overlay only when signed in and pref enabled
    if (settings?.account?.signedIn && settings?.showIntroOnLaunch) {
      setShowIntro(true);
      const t = setTimeout(() => setShowIntro(false), 2000);
      return () => clearTimeout(t);
    }
  }, [settings?.account?.signedIn, settings?.showIntroOnLaunch]);

  if (!showIntro) return null;
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <StartupScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, backgroundColor: 'black' },
});
