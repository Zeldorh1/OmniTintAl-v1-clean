// client/src/utils/ar/engine.pro.js
import React, { useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

/**
 * useOverlayGesturesPro
 * - Pan / Pinch / Rotate with gentle springs + optional rotation snap
 * - opts:
 *    - onChange?: (t) => void   // called from JS with { translateX, translateY, scale, rotation } shared refs
 *    - physics?: {
 *        translateSpring?: { stiffness, damping }
 *        scaleSpring?:     { stiffness, damping }
 *        rotationSnapDeg?: number
 *      }
 */
export function useOverlayGesturesPro(opts = {}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const onChangeJS = typeof opts.onChange === "function" ? opts.onChange : () => {};
  const physics = {
    translateSpring: { stiffness: 180, damping: 22, ...(opts.physics?.translateSpring || {}) },
    scaleSpring: { stiffness: 180, damping: 22, ...(opts.physics?.scaleSpring || {}) },
    rotationSnapDeg: opts.physics?.rotationSnapDeg ?? 15,
  };

  // Pan
  const pan = Gesture.Pan()
    .onChange((e) => {
      tx.value += e.changeX ?? 0;
      ty.value += e.changeY ?? 0;
      runOnJS(onChangeJS)({ translateX: tx, translateY: ty, scale, rotation });
    })
    .onEnd(() => {
      tx.value = withSpring(tx.value, physics.translateSpring);
      ty.value = withSpring(ty.value, physics.translateSpring);
    });

  // Pinch
  const pinch = Gesture.Pinch()
    .onChange((e) => {
      // scaleChange is multiplicative
      const mul = e.scaleChange ?? 1;
      scale.value *= mul;
      runOnJS(onChangeJS)({ translateX: tx, translateY: ty, scale, rotation });
    })
    .onEnd(() => {
      scale.value = withSpring(scale.value, physics.scaleSpring);
    });

  // Rotation
  const rotate = Gesture.Rotation()
    .onChange((e) => {
      rotation.value += e.rotationChange ?? 0; // radians
      runOnJS(onChangeJS)({ translateX: tx, translateY: ty, scale, rotation });
    })
    .onEnd(() => {
      if (physics.rotationSnapDeg && Number.isFinite(physics.rotationSnapDeg)) {
        const deg = (rotation.value * 180) / Math.PI;
        const snap = Math.round(deg / physics.rotationSnapDeg) * physics.rotationSnapDeg;
        rotation.value = withSpring((snap * Math.PI) / 180);
      }
    });

  // Compose – no handlers on this!
  const composed = Gesture.Simultaneous(pan, pinch, rotate);

  // Overlay style
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` },
    ],
  }));

  // Reset helper
  const reset = () => {
    tx.value = withSpring(0, physics.translateSpring);
    ty.value = withSpring(0, physics.translateSpring);
    scale.value = withSpring(1, physics.scaleSpring);
    rotation.value = withSpring(0);
  };

  return useMemo(() => ({ composed, style, reset }), []);
}

/**
 * OverlayGestureContainer
 * - Wrap children in a GestureDetector when a gesture is provided
 *   (keeps rendering in "static" mode when gesture is null/undefined)
 */
export function OverlayGestureContainer({ gesture, children }) {
  if (!gesture) {
    // Static render fallback – no gestures attached
    return <View pointerEvents="none">{children}</View>;
  }
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
