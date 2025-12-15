// client/src/screens/premium/PhotoPreviewScreen.tsx
// FINAL · PHOTO LENGTH MEASUREMENT · NO FONT ICONS · PREMIUM

import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Line, Circle } from "react-native-svg";
import { useRoute, useNavigation } from "@react-navigation/native";

import { Icon } from "../../components/Icons"; // ✅ correct for: src/screens/premium -> src/components
import { addEntry } from "@storage/progressStorage";
import { useThemePro } from "@context/ThemeContext";

const { height: screenH } = Dimensions.get("window");

export default function PhotoPreviewScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useThemePro();

  const {
    uri,
    lengthIn: initialLength = 10,
    scalpY: initialScalpY = 200,
    tipY: initialTipY = 900,
  } = route.params || {};

  const MIN_TIP_Y = initialScalpY + 100;
  const MAX_TIP_Y = screenH - 100;

  const startTipYRef = useRef(0);

  const tipYAnim = useRef(
    new Animated.Value(Math.max(MIN_TIP_Y, Math.min(MAX_TIP_Y, initialTipY)))
  ).current;

  const [tipY, setTipY] = useState(
    Math.max(MIN_TIP_Y, Math.min(MAX_TIP_Y, initialTipY))
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        startTipYRef.current = tipY;
      },

      onPanResponderMove: (_evt, g) => {
        const next = Math.max(
          MIN_TIP_Y,
          Math.min(MAX_TIP_Y, startTipYRef.current + g.dy)
        );
        setTipY(next);
        tipYAnim.setValue(next);
      },

      onPanResponderRelease: () => {
        Animated.spring(tipYAnim, {
          toValue: tipY,
          useNativeDriver: false,
          friction: 7,
          tension: 60,
        }).start();
      },
    })
  ).current;

  const currentLengthIn = useMemo(() => {
    const denom = initialTipY - initialScalpY;
    if (!denom) return initialLength;
    const ratio = (tipY - initialScalpY) / denom;
    return Math.max(0, ratio * initialLength);
  }, [tipY, initialScalpY, initialTipY, initialLength]);

  const saveAndReturn = async () => {
    await addEntry({
      dateISO: new Date().toISOString(),
      method: "ai_adjusted",
      length: currentLengthIn,
      unit: "in",
      photoUri: uri,
      scalpY: initialScalpY,
      tipY,
    });
    nav.goBack();
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
      />

      <Image source={{ uri }} style={s.photo} resizeMode="cover" />

      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Line
          x1="50%"
          y1={initialScalpY}
          x2="50%"
          y2={tipY}
          stroke={colors.accent}
          strokeWidth="4"
        />
        <Circle cx="50%" cy={initialScalpY} r="8" fill={colors.accent} />
        <Circle cx="50%" cy={tipY} r="10" fill={colors.accent} />
      </Svg>

      <Animated.View
        style={[s.handle, { top: Animated.subtract(tipYAnim, 20) }]}
        {...panResponder.panHandlers}
      >
        <View style={[s.handleInner, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <View style={s.overlayTextWrap}>
        <Text style={s.lengthText}>{currentLengthIn.toFixed(1)} in</Text>
        <Text style={s.subText}>Drag to adjust tip</Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.btn} onPress={() => nav.goBack()}>
          <Icon name="camera" size={22} color="#fff" />
          <Text style={s.btnText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.accent }]}
          onPress={saveAndReturn}
        >
          <Icon name="check" size={22} color="#fff" />
          <Text style={s.btnText}>Confirm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.outlineBtn]}
          onPress={() => nav.navigate("ProgressTrackerScreen")}
        >
          <Icon name="close" size={22} color="#fff" />
          <Text style={s.btnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.disclaimer}>
        Measurement is approximate. OmniTintAI is not a medical tool.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  photo: { width: "100%", height: "100%", position: "absolute" },

  handle: {
    position: "absolute",
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  handleInner: { width: 16, height: 16, borderRadius: 8 },

  overlayTextWrap: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  lengthText: { fontSize: 28, fontWeight: "900", textAlign: "center", color: "#fff" },
  subText: { fontSize: 12, color: "#ddd", textAlign: "center", marginTop: 4 },

  actions: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  outlineBtn: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#fff" },
  btnText: { marginLeft: 8, fontWeight: "700", color: "#fff" },

  disclaimer: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    textAlign: "center",
  },
});
