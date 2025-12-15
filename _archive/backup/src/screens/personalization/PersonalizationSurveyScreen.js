import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from "react-native";
import { useThemePro } from "../../context/ThemeContext";

export default function PersonalizationSurveyScreen({ navigation }) {
  const { colors } = useThemePro();
  const [answers, setAnswers] = useState({
    goal: "",
    tone: "",
    hairType: "",
    frequency: "",
  });

  const handleChange = (key, value) => setAnswers({ ...answers, [key]: value });

  const handleSubmit = () => {
    console.log("Survey answers:", answers);
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Personalization Survey</Text>
      <Text style={[styles.caption, { color: colors.mute }]}>
        Optional • Answer a few quick questions so OmniTintAI can fine-tune your experience
      </Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>1. What’s your main goal?</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.mute, color: colors.text }]}
          placeholder="e.g. Hair repair, color longevity, shine"
          placeholderTextColor={colors.mute}
          onChangeText={(v) => handleChange("goal", v)}
        />

        <Text style={[styles.label, { color: colors.text }]}>2. What tones or colors do you prefer?</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.mute, color: colors.text }]}
          placeholder="e.g. Ash blonde, vibrant red, soft brown"
          placeholderTextColor={colors.mute}
          onChangeText={(v) => handleChange("tone", v)}
        />

        <Text style={[styles.label, { color: colors.text }]}>3. What’s your hair type?</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.mute, color: colors.text }]}
          placeholder="e.g. Curly, straight, oily, dry, color-treated"
          placeholderTextColor={colors.mute}
          onChangeText={(v) => handleChange("hairType", v)}
        />

        <Text style={[styles.label, { color: colors.text }]}>4. How often do you dye or treat your hair?</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.mute, color: colors.text }]}
          placeholder="e.g. Every 2 months, rarely, once a year"
          placeholderTextColor={colors.mute}
          onChangeText={(v) => handleChange("frequency", v)}
        />

        <Pressable onPress={handleSubmit} style={[styles.button, { backgroundColor: colors.accent }]}>
          <Text style={{ color: colors.contrast, fontWeight: "700" }}>Save Preferences</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "800", marginTop: 10 },
  caption: { fontSize: 14, marginBottom: 20 },
  form: { marginTop: 10 },
  label: { marginTop: 16, fontSize: 15, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    fontSize: 14,
  },
  button: {
    marginTop: 30,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
});
