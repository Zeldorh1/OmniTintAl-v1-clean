import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TrendRadarPro() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trend Radar</Text>
      <Text style={styles.text}>Live trending colors will be shown here soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  text: { color: "#777" },
});
