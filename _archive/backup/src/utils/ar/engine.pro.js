import { useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Animated, useAnimatedStyle, useSharedValue, withSpring, runOnJS } from "react-native-reanimated";

/**
 * OmniTintAI Pro AR Engine
 * - Pan, zoom, rotate gestures with natural physics
 * - Optional AI callback on transform change
 * - Reset / snap-to-center utilities
 */
export function useOverlayGesturesPro(opts = {}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // 👇 Reset / Snap to center
  const reset = () => {
    tx.value = withSpring(0);
    ty.value = withSpring(0);
    scale.value = withSpring(1);
    rotation.value = withSpring(0);
  };

  const pan = Gesture.Pan()
    .onChange(e => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      if (opts.onChange) runOnJS(opts.onChange)({ x: tx.value, y: ty.value, scale: scale.value, rotation: rotation.value });
    });

  const pinch = Gesture.Pinch()
    .onChange(e => {
      scale.value *= e.scaleChange;
      if (opts.onChange) runOnJS(opts.onChange)({ x: tx.value, y: ty.value, scale: scale.value, rotation: rotation.value });
    });

  const rotate = Gesture.Rotation()
    .onChange(e => {
      rotation.value += e.rotationChange;
      if (opts.onChange) runOnJS(opts.onChange)({ x: tx.value, y: ty.value, scale: scale.value, rotation: rotation.value });
    });

  const composed = Gesture.Simultaneous(pan, pinch, rotate);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` }
    ],
  }));

  // Memoized control handle for later integration
  return useMemo(() => ({ tx, ty, scale, rotation, style, composed, reset }), []);
}

/**
 * Simple container for applying gestures
 */
export function OverlayGestureContainer({ gesture, children }) {
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
