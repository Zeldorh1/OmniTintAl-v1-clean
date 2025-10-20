import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { useThemePro } from "../context/ThemeContext";

export default function SettingsThemeScreen() {
  const { theme, mode, switchMode, setCustomAccent } = useThemePro();
  const [colorInput, setColorInput] = useState(theme.accent);

  const applyColor = () => setCustomAccent(colorInput);

  const modes = ["light", "dark", "auto"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>Appearance</Text>

      <View style={styles.section}>
        {modes.map((m) => (
          <Pressable
            key={m}
            onPress={() => switchMode(m)}
            style={[
              styles.modeButton,
              mode === m && { backgroundColor: theme.accent + "33" },
            ]}
          >
            <Text
              style={[
                styles.modeText,
                { color: mode === m ? theme.accent : theme.text },
              ]}
            >
              {m.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.section, { marginTop: 30 }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          Custom Accent Color
        </Text>
        <TextInput
          value={colorInput}
          onChangeText={setColorInput}
          placeholder="#FDAE5F"
          placeholderTextColor="#999"
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.text + "33" },
          ]}
        />
        <Pressable
          onPress={applyColor}
          style={[styles.applyBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Apply</Text>
        </Pressable>
      </View>

      <Text
        style={{
          color: theme.text,
          opacity: 0.7,
          marginTop: 40,
          textAlign: "center",
          fontSize: 12,
        }}
      >
        OmniTintAI Theme Studio © 2025
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 18 },
  section: { flexDirection: "row", justifyContent: "space-around" },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  modeText: { fontSize: 14, fontWeight: "600" },
  label: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  applyBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});
