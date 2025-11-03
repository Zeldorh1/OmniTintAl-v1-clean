// ---------------------------------------------------------------------------
//  shimmerPulse.js
//  Reusable shimmer + pulse animation helpers for the luxury black/gold look
// ---------------------------------------------------------------------------

import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * GoldPulse – wraps any child with a subtle 1.5-second rhythmic scale / opacity pulse.
 */
export function GoldPulse({ children, duration = 1500 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.85,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      {children}
    </Animated.View>
  );
}

/**
 * GoldShimmer – creates a slow diagonal sweep of gold light across content.
 */
export function GoldShimmer({ width = 50, height = 50, duration = 4000 }) {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: width * 2,
          duration,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, width]);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      <Animated.View
        style={{
          position: "absolute",
          left: -width,
          width,
          height,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255,215,0,0)",
            "rgba(255,215,0,0.45)",
            "rgba(255,215,0,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
