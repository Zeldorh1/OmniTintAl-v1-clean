// client/src/components/TelemetryConsentCard.tsx
// Settings card toggle for anonymized stats sharing.
// Safe: does not upload anything in V1 — just stores the preference.

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { useThemePro } from "../context/ThemeContext";
import { getConsent, setConsent } from "../utils/consentStore";

export default function TelemetryConsentCard() {
  const { colors } = useThemePro?.() || { colors: {} };
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await getConsent();
        if (!mounted) return;
        setEnabled(!!c.shareAnonymizedStats);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = async (value: boolean) => {
    setEnabled(value);
    try {
      await setConsent({ shareAnonymizedStats: value, hasAnsweredConsentPrompt: true });
    } catch {}
  };

  return (
    <View style={[s.card, { backgroundColor: colors?.card || "#FFF", borderColor: colors?.divider || "#E5E7EB" }]}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors?.text || "#111" }]}>Data & Privacy</Text>
          <Text style={[s.sub, { color: colors?.mute || "#6B7280" }]}>
            Share anonymized usage stats to improve recommendations. No photos. No personal info.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Switch value={enabled} onValueChange={toggle} />
        )}
      </View>

      <Text style={[s.micro, { color: colors?.mute || "#6B7280" }]}>
        You can still use OmniTintAI fully with this off.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 15, fontWeight: "900" },
  sub: { marginTop: 6, fontSize: 12, lineHeight: 16 },
  micro: { marginTop: 10, fontSize: 11 },
});
