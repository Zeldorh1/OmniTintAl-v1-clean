// client/BootProbe.js — FINAL FLAGSHIP VERSION
//
// Purpose:
// - Run nightly / periodic personalization + telemetry-safe tasks
// - NO UI, NO extra startup video, NO navigation
// - Just a silent “brain” that keeps OmniTintAI smart over time

import React, { useEffect } from 'react';

// NOTE: paths are from the client root!
import { useSettings } from './context/SettingsContext';
import { maybeNightlyTasks } from './personalization/personalizer.sync';

// When you're ready, point this to your real global weights JSON
const GLOBAL_URL =
  'https://<your-stable-host>/model/global_personalizer_v1.json';

export default function BootProbe() {
  const { settings } = useSettings?.() || {};

  useEffect(() => {
    // Fire-and-forget nightly / periodic maintenance.
    // This respects your "share anonymized stats" toggle.
    try {
      maybeNightlyTasks({
        allowTelemetry: settings?.shareAnonymizedStats ?? true,
        globalUrl: GLOBAL_URL || null,
      });
    } catch (e) {
      console.warn('[BootProbe] nightly tasks error', e);
    }
    // You can make this smarter later (e.g., only once per 24h)
  }, [settings?.shareAnonymizedStats]);

  // No overlay, no video, no UI.
  return null;
}
