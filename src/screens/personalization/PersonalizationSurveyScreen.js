// client/src/screens/Personalization/PersonalizationSurveyScreen.js
// V1 FLAGSHIP — premium onboarding survey (high-signal)
// - 7 questions, fast
// - Save disabled until complete
// - Skip option
// - Writes to personalizationStore (AsyncStorage)
// - Logs Brain event: personalization.saved (metadata-only)
// - Designed to instantly re-rank Home recommendations

import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemePro } from "../../context/ThemeContext";
import { savePersonalization } from "../../utils/personalizationStore";

// ✅ Brain logging wrapper
import { logPersonalizationSaved } from "../../brain/events";

function OptionPill({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.pill, selected && s.pillOn]}>
      <Text style={[s.pillText, selected && s.pillTextOn]}>{label}</Text>
    </Pressable>
  );
}

export default function PersonalizationSurveyScreen({ navigation }) {
  const { colors } = useThemePro?.() || { colors: {} };

  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [tonePreference, setTonePreference] = useState(null);
  const [styleVibe, setStyleVibe] = useState(null);
  const [texture, setTexture] = useState(null);
  const [strandThickness, setStrandThickness] = useState(null);
  const [isColorTreated, setIsColorTreated] = useState(null);
  const [routineConsistency, setRoutineConsistency] = useState(null);

  const answeredCount = useMemo(() => {
    let c = 0;
    if (primaryGoal) c++;
    if (tonePreference) c++;
    if (styleVibe) c++;
    if (texture) c++;
    if (strandThickness) c++;
    if (typeof isColorTreated === "boolean") c++;
    if (routineConsistency) c++;
    return c;
  }, [
    primaryGoal,
    tonePreference,
    styleVibe,
    texture,
    strandThickness,
    isColorTreated,
    routineConsistency,
  ]);

  const isComplete = answeredCount === 7;

  const payload = useMemo(
    () => ({
      primaryGoal,
      tonePreference,
      styleVibe,
      texture,
      strandThickness,
      isColorTreated,
      routineConsistency,

      // legacy (kept for compatibility if older code reads these)
      goal: "",
      tone: "",
      hairType: "",
      frequency: "",
    }),
    [
      primaryGoal,
      tonePreference,
      styleVibe,
      texture,
      strandThickness,
      isColorTreated,
      routineConsistency,
    ]
  );

  const onSave = async () => {
    if (!isComplete) return;

    try {
      // ✅ savePersonalization returns the normalized profile (from your personalizationStore.js)
      const normalizedProfile = await savePersonalization(payload);

      // ✅ Brain event (metadata-only)
      await logPersonalizationSaved(normalizedProfile);
    } catch (e) {
      console.warn("[PersonalizationSurvey] save/log failed:", e);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors?.background || "#fff" }]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.topBar}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[s.topAction, { color: colors?.text || "#111" }]}>Skip</Text>
        </Pressable>

        <Text style={[s.topTitle, { color: colors?.text || "#111" }]}>
          Personalize OmniTintAI
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: colors?.text || "#111" }]}>Quick setup</Text>

        <Text style={[s.sub, { color: colors?.mute || "#6B7280" }]}>
          This tunes your Home recommendations instantly. You can change it anytime.
        </Text>

        <Text style={[s.progress, { color: colors?.mute || "#6B7280" }]}>
          {answeredCount}/7 answered
        </Text>

        <Text style={[s.q, { color: colors?.text || "#111" }]}>1) Main goal</Text>
        <View style={s.row}>
          {[
            ["repair", "Repair"],
            ["growth", "Growth"],
            ["color_protection", "Color Safe"],
            ["frizz_control", "Frizz"],
            ["shine", "Shine"],
            ["maintenance", "Easy"],
            ["volume", "Volume"],
          ].map(([k, label]) => (
            <OptionPill
              key={k}
              label={label}
              selected={primaryGoal === k}
              onPress={() => setPrimaryGoal(k)}
            />
          ))}
        </View>

        <Text style={[s.q, { color: colors?.text || "#111" }]}>2) Undertone preference</Text>
        <View style={s.row}>
          {[
            ["warm", "Warm"],
            ["cool", "Cool"],
            ["neutral", "Neutral"],
          ].map(([k, label]) => (
            <OptionPill
              key={k}
              label={label}
              selected={tonePreference === k}
              onPress={() => setTonePreference(k)}
            />
          ))}
        </View>

        <Text style={[s.q, { color: colors?.text || "#111" }]}>3) Vibe</Text>
        <View style={s.row}>
          {[
            ["natural", "Natural"],
            ["bold", "Bold"],
            ["experimental", "Experimental"],
          ].map(([k, label]) => (
            <OptionPill
              key={k}
              label={label}
              selected={styleVibe === k}
              onPress={() => setStyleVibe(k)}
            />
          ))}
        </View>

        <Text style={[s.q, { color: colors?.text || "#111" }]}>4) Texture</Text>
        <View style={s.row}>
          {[
            ["straight", "Straight"],
            ["wavy", "Wavy"],
            ["curly", "Curly"],
            ["coily", "Coily"],
          ].map(([k, label]) => (
            <OptionPill
              key={k}
              label={label}
              selected={texture === k}
              onPress={() => setTexture(k)}
            />
          ))}
        </View>

        <Text style={[s.q, { color: colors?.text || "#111" }]}>5) Strand thickness</Text>
        <View style={s.row}>
          {[
            ["fine", "Fine"],
            ["medium", "Medium"],
            ["thick", "Thick"],
          ].map(([k, label]) => (
            <OptionPill
              key={k}
              label={label}
              selected={strandThickness === k}
              onPress={() => setStrandThickness(k)}
            />
          ))}
        </View>

        <Text style={[s.q, { color: colors?.text || "#111" }]}>6) Color-treated?</Text>
        <View style={s.row}>
          {[
            ["yes", "Yes"],
            ["no", "No"],
          ].map(([k, label]) => (
            <OptionPill
              key={k}
              label={label}
              selected={typeof isColorTreated === "boolean" && isColorTreated === (k === "yes")}
              onPress={() => setIsColorTreated(k === "yes")}
            />
          ))}
        </View>

        <Text style={[s.q, { color: colors?.text || "#111" }]}>7) Routine consistency</Text>
        <View style={s.row}>
          {[
            ["low", "Low"],
            ["medium", "Medium"],
            ["high", "High"],
          ].map(([k, label]) => (
            <OptionPill
              key={k}
              label={label}
              selected={routineConsistency === k}
              onPress={() => setRoutineConsistency(k)}
            />
          ))}
        </View>

        <Pressable
          onPress={onSave}
          disabled={!isComplete}
          style={[
            s.save,
            { backgroundColor: isComplete ? (colors?.accent || "#111") : "#C7CBD1" },
          ]}
        >
          <Text
            style={[
              s.saveText,
              { color: isComplete ? (colors?.contrast || "#fff") : "#7A808A" },
            ]}
          >
            Save Preferences
          </Text>
        </Pressable>

        <Text style={[s.footer, { color: colors?.mute || "#6B7280" }]}>
          We only use this to personalize recommendations.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  topTitle: { fontSize: 16, fontWeight: "900" },
  topAction: { fontSize: 14, fontWeight: "900" },

  body: { padding: 18, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 6, fontSize: 13, lineHeight: 18 },
  progress: { marginTop: 10, fontSize: 12, fontWeight: "800" },

  q: { marginTop: 18, fontSize: 14, fontWeight: "900" },
  row: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },

  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  pillOn: { backgroundColor: "#111", borderColor: "#111" },
  pillText: { fontSize: 13, fontWeight: "900", color: "#111" },
  pillTextOn: { color: "#fff" },

  save: { marginTop: 22, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  saveText: { fontSize: 14, fontWeight: "900" },
  footer: { marginTop: 12, fontSize: 12, textAlign: "center" },
});
