// client/src/screens/premium/ARStudioMainV2.js
// Live AR try-on foundation (SDK 54, expo-camera)
// - Live camera feed + overlay layer
// - Style picker (stub) + color/opacity controls
// - Capture snapshot → preview modal → save to gallery
// - Clean black/white minimal UI to match app

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, Image, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";

// Fake styles DB (placeholder)
const STYLE_CATALOG = [
  { id: "sleek", name: "Sleek Straight", uri: "https://i.imgur.com/E8x8m8L.png" },
  { id: "waves", name: "Soft Waves", uri: "https://i.imgur.com/2S6Q3uM.png" },
  { id: "bob", name: "Modern Bob", uri: "https://i.imgur.com/7vdj1vM.png" },
  { id: "pony", name: "High Pony", uri: "https://i.imgur.com/6T2zK1v.png" },
];

// Overlay component
const LiveStyleOverlay = ({ styleUri, opacity = 0.9 }) => {
  if (!styleUri) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      <Image
        source={{ uri: styleUri }}
        resizeMode="contain"
        style={{ width: "80%", height: "60%", opacity }}
      />
    </View>
  );
};

const Pill = ({ label, active, onPress }) => (
  <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </Pressable>
);

export default function ARStudioMainV2() {
  const [permission, requestPermission] = useCameraPermissions();
  const [galleryPerm, requestGalleryPerm] = MediaLibrary.usePermissions();
  const cameraRef = useRef(null);

  const [activeTab, setActiveTab] = useState("Styles");
  const [selectedStyle, setSelectedStyle] = useState(STYLE_CATALOG[0]);
  const [overlayOpacity, setOverlayOpacity] = useState(0.9);
  const [previewUri, setPreviewUri] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!permission || permission.status === "undetermined") {
      requestPermission();
    }
    if (!galleryPerm || galleryPerm.status === "undetermined") {
      requestGalleryPerm();
    }
  }, [permission?.status, galleryPerm?.status]);

  const onCapture = useCallback(async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync?.({ quality: 0.9, skipProcessing: true });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
        setPreviewOpen(true);
      }
    } catch (e) {
      console.warn("[AR Live] capture failed", e);
    }
  }, []);

  const onSave = useCallback(async () => {
    try {
      if (!previewUri) return;
      if (galleryPerm?.status !== "granted") await requestGalleryPerm();
      await MediaLibrary.saveToLibraryAsync(previewUri);
      setPreviewOpen(false);
    } catch (e) {
      console.warn("[AR Live] save failed", e);
    }
  }, [previewUri, galleryPerm?.status]);

  const renderStyleItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.styleItem, selectedStyle?.id === item.id && styles.styleItemActive]}
      onPress={() => setSelectedStyle(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.styleThumb} resizeMode="contain" />
      <Text style={styles.styleName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={{ flex: 1 }}>
          {/* Camera feed */}
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" enableZoomGesture />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.center]}>
              <Text style={{ color: "#fff", marginBottom: 8 }}>Camera permission needed</Text>
              <Pressable style={styles.btn} onPress={requestPermission}>
                <Text style={styles.btnText}>Grant</Text>
              </Pressable>
            </View>
          )}

          {/* LIVE overlay */}
          <LiveStyleOverlay styleUri={selectedStyle?.uri} opacity={overlayOpacity} />

          {/* Top search + tabs */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Text style={styles.searchText}>Search styles, colors, accessories…</Text>
            </View>
            <View style={styles.pillsRow}>
              {["Styles", "Colors", "Accessories"].map((t) => (
                <Pill key={t} label={t} active={activeTab === t} onPress={() => setActiveTab(t)} />
              ))}
            </View>
          </View>

          {/* Bottom controls */}
          <View style={styles.controls}>
            <Pressable style={styles.controlBtn} onPress={() => setOverlayOpacity(0.9)}>
              <Text style={styles.controlText}>Reset</Text>
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={onCapture}>
              <Text style={styles.controlText}>Capture</Text>
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={() => setOverlayOpacity((o) => Math.max(0.2, o - 0.1))}>
              <Text style={styles.controlText}>Opacity −</Text>
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={() => setOverlayOpacity((o) => Math.min(1, o + 0.1))}>
              <Text style={styles.controlText}>Opacity +</Text>
            </Pressable>
          </View>

          {/* Style picker tray */}
          {activeTab === "Styles" && (
            <View style={styles.tray}>
              <FlatList
                horizontal
                data={STYLE_CATALOG}
                keyExtractor={(it) => it.id}
                renderItem={renderStyleItem}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>

        {/* Preview modal */}
        <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <Image source={{ uri: previewUri }} style={styles.previewImg} resizeMode="cover" />
              <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <Pressable style={styles.modalBtn} onPress={() => setPreviewOpen(false)}>
                  <Text style={styles.modalBtnText}>Close</Text>
                </Pressable>
                <Pressable style={styles.modalBtn} onPress={onSave}>
                  <Text style={styles.modalBtnText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  searchWrap: { position: "absolute", top: 12, left: 12, right: 12 },
  searchBar: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8 },
  searchText: { color: "#fff", opacity: 0.9 },
  pillsRow: { flexDirection: "row", gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  pillActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  pillText: { color: "#fff" },
  pillTextActive: { color: "#fff", fontWeight: "700" },
  controls: { position: "absolute", bottom: 28, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 12 },
  controlBtn: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  controlText: { color: "#fff", fontWeight: "700" },
  tray: { position: "absolute", bottom: 90, left: 0, right: 0 },
  styleItem: { width: 96, alignItems: "center", marginRight: 10, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12 },
  styleItemActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  styleThumb: { width: 80, height: 60 },
  styleName: { color: "#fff", fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  btnText: { color: "#fff", fontWeight: "700" },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "86%", backgroundColor: "#111", padding: 12, borderRadius: 16 },
  previewImg: { width: "100%", height: 380, borderRadius: 12 },
});
