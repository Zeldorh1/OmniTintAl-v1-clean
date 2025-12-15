import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BagPro() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Bag</Text>
      <Text style={styles.text}>Items added to your cart will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  text: { color: "#777" },
});
