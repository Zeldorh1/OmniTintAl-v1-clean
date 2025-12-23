import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useThemePro } from "../../context/ThemeContext";
import { getConsent } from "../../utils/consentStore";
import { countEvents } from "../../utils/eventLogger";

export default function BrainDebugScreen() {
  const { colors } = useThemePro?.() || { colors: {} };
  const [consent, setConsentState] = useState<any>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    const c = await getConsent();
    setConsentState(c);

    const types = [
      "personalization.saved",
      "scan.completed",
      "product.used",
      "bag.added",
      "purchase.recorded",
      "app.session",
    ];

    const out: any = {};
    for (const t of types) out[t] = await countEvents(t);
    out["ALL"] = await countEvents();
    setCounts(out);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={[s.container, { backgroundColor: colors?.background || "#FFF" }]} contentContainerStyle={{ padding: 16 }}>
      <Text style={[s.title, { color: colors?.text || "#111" }]}>🧠 Brain Debug</Text>

      <View style={[s.card, { borderColor: colors?.divider || "#E5E7EB", backgroundColor: colors?.card || "#FFF" }]}>
        <Text style={[s.h, { color: colors?.text || "#111" }]}>Consent</Text>
        <Text style={[s.p, { color: colors?.mute || "#6B7280" }]}>
          answered: {String(!!consent?.hasAnsweredConsentPrompt)}
          {"\n"}shareAnonymizedStats: {String(!!consent?.shareAnonymizedStats)}
          {"\n"}updatedAt: {consent?.updatedAt ? new Date(consent.updatedAt).toLocaleString() : "n/a"}
        </Text>
      </View>

      <View style={[s.card, { borderColor: colors?.divider || "#E5E7EB", backgroundColor: colors?.card || "#FFF" }]}>
        <Text style={[s.h, { color: colors?.text || "#111" }]}>Event counts (SQLite)</Text>
        {Object.entries(counts).map(([k, v]) => (
          <Text key={k} style={[s.p, { color: colors?.mute || "#6B7280" }]}>
            {k}: {v}
          </Text>
        ))}
      </View>

      <Pressable onPress={load} style={[s.btn, { backgroundColor: colors?.accent || "#111" }]}>
        <Text style={[s.btnText, { color: colors?.contrast || "#FFF" }]}>Refresh</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, marginBottom: 12 },
  h: { fontSize: 14, fontWeight: "900", marginBottom: 8 },
  p: { fontSize: 12, lineHeight: 16 },
  btn: { marginTop: 4, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  btnText: { fontSize: 14, fontWeight: "900" },
});
