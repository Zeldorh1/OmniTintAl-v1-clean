
import { useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';

/**
 * Unified gesture engine for AR overlays.
 * - Pan (one finger)
 * - Pinch to zoom (two fingers)
 * - Rotate (two fingers)
 */
export function useOverlayGestures(opts?: { onChange?: (t:{x:number;y:number;scale:number;rotation:number})=>void }){
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
    })
    .onEnd(() => { if (opts?.onChange) runOnJS(opts.onChange)({ x: tx.value, y: ty.value, scale: scale.value, rotation: rotation.value }); });

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      scale.value *= e.scaleChange;
    })
    .onEnd(() => { if (opts?.onChange) runOnJS(opts.onChange)({ x: tx.value, y: ty.value, scale: scale.value, rotation: rotation.value }); });

  const rotate = Gesture.Rotation()
    .onChange((e) => {
      rotation.value += e.rotationChange;
    })
    .onEnd(() => { if (opts?.onChange) runOnJS(opts.onChange)({ x: tx.value, y: ty.value, scale: scale.value, rotation: rotation.value }); });

  const composed = Gesture.Simultaneous(pan, pinch, rotate);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` }
    ]
  }));

  return { tx, ty, scale, rotation, style, composed };
}

/** Convenience wrapper to apply gestures to a child view */
export function OverlayGestureContainer({ gesture, children }:{ gesture: ReturnType<typeof useOverlayGestures>['composed']; children: React.ReactNode }){
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
