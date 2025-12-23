// client/src/BootProbe.js — FINAL (Consent-safe, V1 launch)
//
// Purpose:
// - Run nightly / periodic personalization tasks
// - Telemetry-safe: respects REQUIRED-CHOICE consent (consentStore)
// - NO UI, NO navigation, NO side effects at import-time

import React, { useEffect } from "react";
import { maybeNightlyTasks } from "./personalization/personalizer.sync";
import { getConsent } from "./utils/consentStore";

// When you're ready, point this to your real global weights JSON
const GLOBAL_URL = "https://<your-stable-host>/model/global_personalizer_v1.json";

export default function BootProbe() {
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const consent = await getConsent();

        // ✅ REQUIRED-CHOICE RULE:
        // If user has not answered yet, treat as NO telemetry.
        const answered = !!consent?.hasAnsweredConsentPrompt;
        const allowTelemetry = answered ? !!consent?.shareAnonymizedStats : false;

        if (!alive) return;

        // Fire-and-forget maintenance.
        maybeNightlyTasks({
          allowTelemetry,
          globalUrl: GLOBAL_URL || null,
        });
      } catch (e) {
        // fail-open (never break launch)
        console.warn("[BootProbe] nightly tasks error", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return null;
}
