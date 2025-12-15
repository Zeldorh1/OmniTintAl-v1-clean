import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import Animated from "react-native-reanimated";
import { Camera, CameraType } from "expo-camera";
import { useOverlayGesturesPro, OverlayGestureContainer } from "@utils/ar/engine.pro";
import styleCatalog from "@data/styles.json";

const CATEGORIES = [
  "All",
  "Dreads/Locs",
  "Braids",
  "Curls",
  "Fades",
  "Short Cuts",
  "Long",
  "Medium",
  "Short",
];

export default function ARStudio() {
  const [perm, setPerm] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(null);

  const { composed, style, reset } = useOverlayGesturesPro({
    onChange: (t) => console.log("AR transform update:", t),
  });

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPerm(status === "granted");
    })();
  }, []);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return styleCatalog.filter(
      (s) =>
        (cat === "All" || s.category === cat) &&
        (s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q))
    );
  }, [query, cat]);

  if (perm === null)
    return (
      <SafeAreaView>
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  if (perm === false)
    return (
      <SafeAreaView>
        <Text>No camera access</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header Search */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f3f4f6",
          borderRadius: 12,
          paddingHorizontal: 10,
          margin: 10,
        }}
      >
        <TextInput
          placeholder="Search hairstyles..."
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1, color: "#111" }}
        />
      </View>

      {/* Category Bar */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setCat(item)}
            style={{
              backgroundColor: cat === item ? "#111" : "#e5e7eb",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              marginRight: 8,
            }}
          >
            <Text
              style={{
                color: cat === item ? "#fff" : "#111",
                fontWeight: "600",
              }}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />

      {/* Camera Preview */}
      <View style={{ flex: 1 }}>
        <Camera style={StyleSheet.absoluteFill} type={CameraType.front} />
        <OverlayGestureContainer gesture={composed}>
          <Animated.Image
            source={require("../../../assets/placeholder.png")}
            style={[
              {
                width: 320,
                height: 240,
                position: "absolute",
                top: 200,
                left: 100,
                resizeMode: "contain",
              },
              style,
            ]}
          />
        </OverlayGestureContainer>
      </View>

      {/* Reset Button */}
      <Pressable
        onPress={reset}
        style={{
          position: "absolute",
          bottom: 30,
          alignSelf: "center",
          backgroundColor: "#111",
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Reset</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "#fff",
    fontSize: 16,
  },
});
