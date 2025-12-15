// src/components/LengthRuler.js
import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';

export default function LengthRuler({
  min = 0,
  max = 30,        // inches by default
  step = 0.25,     // 1/4" steps (or 0.5 cm if unit="cm")
  unit = 'in',     // 'in' | 'cm'
  value,
  onChange,
  height = 260,    // visual height of the ruler
  compact = false, // smaller labels for on-photo overlay
}) {
  const trackRef = useRef(null);
  const [trackHeight, setTrackHeight] = useState(height);

  const clamp = (v) => Math.min(max, Math.max(min, v));

  const yToValue = (y) => {
    // 0 at top => max; bottom => min (vertical ruler)
    const pctFromTop = y / trackHeight;
    const raw = max - pctFromTop * (max - min);
    // snap to step
    const snapped = Math.round(raw / step) * step;
    return clamp(parseFloat(snapped.toFixed(2)));
  };

  const valueToY = (v) => {
    const pctFromTop = (max - v) / (max - min);
    return pctFromTop * trackHeight;
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, g) => {
        const { locationY } = e.nativeEvent;
        onChange?.(yToValue(locationY));
      },
      onPanResponderMove: (e, g) => {
        const { locationY } = e.nativeEvent;
        onChange?.(yToValue(locationY));
      },
    })
  ).current;

  const y = valueToY(clamp(value ?? min));

  // marks every 1 unit; longer label every 5
  const marks = [];
  for (let v = min; v <= max + 0.0001; v += 1) {
    const markY = valueToY(v);
    const long = v % 5 === 0;
    marks.push(
      <View
        key={`m-${v}`}
        style={[
          styles.mark,
          {
            top: markY - 0.5,
            width: long ? 22 : 12,
            opacity: long ? 0.6 : 0.35,
          },
        ]}
      />
    );
    if (long) {
      marks.push(
        <Text
          key={`t-${v}`}
          style={[
            styles.label,
            { top: markY - 8, fontSize: compact ? 10 : 12 },
          ]}
        >
          {v}{unit}
        </Text>
      );
    }
  }

  return (
    <View
      ref={trackRef}
      onLayout={(e) => setTrackHeight(e.nativeEvent.layout.height)}
      style={[styles.wrap, { height }]}
      {...pan.panHandlers}
    >
      <View style={styles.track}>{marks}</View>
      {/* Handle */}
      <View style={[styles.handle, { top: y - 12 }]}>
        <View style={styles.handleDot} />
        <Text style={[styles.handleText, compact && { fontSize: 11 }]}>
          {value?.toFixed?.(2)}{unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderColor: '#111',
  },
  mark: {
    position: 'absolute',
    left: 2,
    height: 1,
    backgroundColor: '#111',
  },
  label: {
    position: 'absolute',
    left: 26,
    color: '#111',
  },
  handle: {
    position: 'absolute',
    left: -6,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  handleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#111',
    marginRight: 6,
  },
  handleText: { color: '#111', fontWeight: '700' },
});
