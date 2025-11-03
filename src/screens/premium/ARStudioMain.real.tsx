import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CameraView, useCameraPermissions } from 'expo-camera';

/**
 * ARStudioMain.debug.tsx
 * ------------------------------------------------------
 * A drop-in, self-contained debug harness for isolating the
 * "Element type is invalid (got: object)" render error.
 *
 * What it does:
 *  - Builds the screen layer-by-layer with a Stage switcher.
 *  - Each layer is wrapped in an ErrorBoundary so we see exactly
 *    which piece throws.
 *  - Logs typeof checks for usual suspects (Camera/SafeArea/etc.).
 *  - Uses SDK 54-friendly CameraView + useCameraPermissions.
 *
 * How to use:
 *  1) Replace your current ARStudioMain import with this file.
 *     (e.g., in your navigator: `import ARStudioMain from "../screens/ARStudioMain.debug";`)
 *  2) Run the screen and use the on-screen DEV HUD to step stages 0→4.
 *  3) The first stage that throws is your culprit. See console + badge.
 *  4) Once fixed, swap this screen back out for your real one.
 */

// -----------------------------
// Small utilities
// -----------------------------
class Boundary extends React.Component<{ label: string }, { err?: Error }>{
  constructor(props: any) {
    super(props);
    this.state = { err: undefined };
  }
  componentDidCatch(error: Error) {
    // Keep it visible and traceable in logs
    console.error(`[Boundary:${this.props.label}]`, error);
    this.setState({ err: error });
  }
  render() {
    if (this.state.err) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.centered, { backgroundColor: 'rgba(255,0,0,0.1)' }]}>
          <Text style={styles.errTitle}>💥 {this.props.label} crashed</Text>
          <Text style={styles.errBody}>{String(this.state.err?.message || this.state.err)}</Text>
        </View>
      );
    }
    return <>{this.props.children}</>;
  }
}

const TypeBadge = ({ name, value }: { name: string; value: any }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{name}: {typeof value}</Text>
  </View>
);

// Simple overlay for testing composition layer
const SafeOverlay = () => (
  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
    <View style={styles.overlayChip}><Text style={styles.overlayChipText}>Overlay OK</Text></View>
  </View>
);

const ControlsBar = ({ onReset }: { onReset: () => void }) => (
  <View style={styles.controls}>
    <Pressable style={styles.controlBtn} onPress={onReset}><Text style={styles.controlText}>Reset</Text></Pressable>
    <Pressable style={styles.controlBtn} onPress={() => console.log('[Controls] Capture pressed')}>
      <Text style={styles.controlText}>Capture</Text>
    </Pressable>
    <Pressable style={styles.controlBtn} onPress={() => console.log('[Controls] Save pressed')}>
      <Text style={styles.controlText}>Save</Text>
    </Pressable>
  </View>
);

const DevHUD = ({ stage, setStage }: { stage: number; setStage: (n: number) => void }) => (
  <View style={styles.hud} pointerEvents="box-none">
    <View style={styles.hudRow}>
      <Pressable style={styles.hudBtn} onPress={() => setStage(Math.max(0, stage - 1))}><Text style={styles.hudBtnTxt}>◀︎</Text></Pressable>
      <Text style={styles.hudStage}>Stage {stage}</Text>
      <Pressable style={styles.hudBtn} onPress={() => setStage(Math.min(4, stage + 1))}><Text style={styles.hudBtnTxt}>▶︎</Text></Pressable>
    </View>
    <Text style={styles.hudHelp}>0=shell · 1=camera · 2=overlay · 3=controls · 4=all</Text>
  </View>
);

const StageLegend = () => (
  <View style={styles.legend}> 
    <TypeBadge name="CameraView" value={CameraView} />
    <TypeBadge name="SafeAreaView" value={SafeAreaView} />
    <TypeBadge name="Platform" value={Platform} />
  </View>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  </GestureHandlerRootView>
);

const CameraLayer = React.forwardRef<CameraView, { visible: boolean }>((props, ref) => {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission || permission.status === 'undetermined') {
      requestPermission();
    }
  }, [permission?.status]);

  if (!props.visible) return null;

  if (!permission?.granted) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.centered]}>
        <Text style={{ color: '#fff', marginBottom: 8 }}>Camera permission needed</Text>
        <Pressable style={styles.controlBtn} onPress={requestPermission}><Text style={styles.controlText}>Grant</Text></Pressable>
      </View>
    );
  }

  return (
    <Boundary label="CameraView">
      <CameraView
        ref={ref}
        style={StyleSheet.absoluteFill}
        facing="front"
        enableZoomGesture
      />
    </Boundary>
  );
});
CameraLayer.displayName = 'CameraLayer';

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------
const ARStudioMain: React.FC = () => {
  const [stage, setStage] = useState<number>(4); // start with all; step back if it throws
  const cameraRef = useRef<CameraView>(null);

  // Helpful console fingerprints
  useEffect(() => {
    console.log('[ARStudioMain.debug] typeof CameraView =', typeof CameraView);
    console.log('[ARStudioMain.debug] typeof SafeAreaView =', typeof SafeAreaView);
  }, []);

  const reset = useCallback(() => {
    console.log('[Controls] Reset pressed');
  }, []);

  return (
    <Shell>
      <DevHUD stage={stage} setStage={setStage} />
      <StageLegend />

      {/* Stage 1: Camera */}
      <CameraLayer ref={cameraRef} visible={stage >= 1} />

      {/* Stage 2: Overlay */}
      {stage >= 2 && (
        <Boundary label="SafeOverlay">
          <SafeOverlay />
        </Boundary>
      )}

      {/* Stage 3: Controls */}
      {stage >= 3 && (
        <Boundary label="ControlsBar">
          <ControlsBar onReset={reset} />
        </Boundary>
      )}
    </Shell>
  );
};

export default ARStudioMain;

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  centered: { justifyContent: 'center', alignItems: 'center' },
  hud: {
    position: 'absolute', top: 10, left: 10, right: 10,
    alignItems: 'center', zIndex: 200,
  },
  hudRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  hudBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
  hudBtnTxt: { color: '#fff', fontWeight: '600' },
  hudStage: { color: '#fff', fontWeight: '700' },
  hudHelp: { color: '#ccc', marginTop: 4, fontSize: 12 },
  legend: {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, zIndex: 200,
  },
  badge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12 },
  overlayChip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  overlayChipText: { color: '#fff', fontWeight: '600' },
  controls: {
    position: 'absolute', bottom: 28, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 16,
  },
  controlBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  controlText: { color: '#fff', fontWeight: '700' },
});

