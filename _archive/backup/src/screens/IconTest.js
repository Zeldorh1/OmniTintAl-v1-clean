import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Font from "expo-font";

export default function IconTest() {
  useEffect(() => {
    // Manually ensure the font is loaded
    Font.loadAsync(Ionicons.font);
    Font.loadAsync(MaterialCommunityIcons.font);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 20 }}>🧠 Icon Test</Text>

      <Ionicons name="home" size={40} color="#FDAE5F" />
      <Ionicons name="heart" size={40} color="#FF6F91" />
      <Ionicons name="bag-handle" size={40} color="#7E57C2" />
      <MaterialCommunityIcons name="hair-dryer" size={40} color="#03A9F4" />

      <Text style={{ marginTop: 20, color: "#555" }}>
        If you see 4 icons above (home, heart, bag, hair-dryer),
        your fonts are working.
      </Text>
    </View>
  );
}
