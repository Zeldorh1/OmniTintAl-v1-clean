import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useThemePro } from "../../context/ThemeContext";

// ✅ FIXED: use the new store (your renamed file)
import { saveSurveyAnswers, loadSurveyAnswers, logEvent } from "../../storage/UserProfileStore";

const QUESTIONS = [
  { key: "hair_type", label: "Your hair type", options: ["straight", "wavy", "curly", "coily"] },
  { key: "scalp_condition", label: "Scalp condition", options: ["balanced", "oily", "dry", "dandruff"] },
  { key: "goal", label: "Main hair goal", options: ["repair", "volume", "longevity", "color-safe"] },
  { key: "preferred_tones", label: "Favorite tones", options: ["ash", "warm", "neutral", "vivid"] },
  { key: "chemical_sensitivity", label: "Sensitive to chemicals?", options: ["no", "mild", "yes"] },
  { key: "styling_time", label: "Typical styling time", options: ["<10m", "10-20m", "20-40m", ">40m"] },
];

export default function PersonalizationSurveyScreen({ navigation }) {
  const { theme } = useThemePro();
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    (async () => {
      const existing = await loadSurveyAnswers();
      if (existing) setAnswers(existing);
    })();
  }, []);

  const pick = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));

  const submit = async () => {
    // ✅ Keep it user-friendly: store only answers + minimal meta
    const payload = {
      ...answers,
      module: "Personalization",
      region: "US-IN",
      theme_color: theme?.accent,
      created_at: new Date().toISOString(),
    };

    await saveSurveyAnswers(payload);

    // ✅ Replaces pushMetaEvent: lightweight local telemetry
    await logEvent("PERSONALIZATION_SUBMIT", {
      tags: Object.keys(answers),
      answeredCount: Object.keys(answers).length,
    });

    navigation.goBack();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>Personalization & Recommendations</Text>
      <Text style={[styles.caption, { color: theme.text, opacity: 0.7 }]}>
        Optional • Answer a few quick questions to tailor styles, colors, and products to you.
      </Text>

      {QUESTIONS.map((q) => (
        <View key={q.key} style={styles.card}>
          <Text style={[styles.q, { color: theme.text }]}>{q.label}</Text>

          <View style={styles.row}>
            {q.options.map((opt) => {
              const active =
                answers[q.key] === opt ||
                (Array.isArray(answers[q.key]) && answers[q.key]?.includes?.(opt));

              return (
                <Pressable
                  key={opt}
                  onPress={() => pick(q.key, opt)}
                  style={[
                    styles.pill,
                    {
                      borderColor: theme.text + "22",
                      backgroundColor: active ? theme.accent + "26" : "#fff",
                    },
                  ]}
                >
                  <Text style={{ color: active ? theme.accent : theme.text, fontWeight: "600" }}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable onPress={submit} style={[styles.cta, { backgroundColor: theme.accent }]}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Save & Apply</Text>
      </Pressable>

      <Text style={{ textAlign: "center", marginTop: 10, color: theme.text, opacity: 0.6, fontSize: 12 }}>
        You can edit this anytime in Settings • Stored locally unless you enable cloud sync.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  caption: { fontSize: 13, marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  q: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  cta: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
