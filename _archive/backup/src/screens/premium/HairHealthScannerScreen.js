// client/src/screens/premium/HairHealthScannerScreen.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '../../context/SettingsContext';
import { buildScannerVector } from '../../utils/scannerFeatures';
import { predict, blendScores, learn } from '../../utils/personalizer';
import { queueLabel, track } from '../../utils/telemetry';
import { analyzeAsync } from '../../components/FaceMeshWorker'; // your worker; adjust path if needed

const BAD_THRESHOLD = 0.60; // ≥ 60% -> Recovery path, else Good path

export default function HairHealthScannerScreen({ navigation, route }) {
  const { settings } = useSettings();
  // If you pass a precomputed scan via route, we’ll use it; otherwise we analyze a picked photo.
  const [scan, setScan] = useState(route?.params?.scanResult || null);
  const [env, setEnv]   = useState(route?.params?.captureEnv || { lux: 0.6, expoBias: 0, blur: 0.1 });
  const [busy, setBusy] = useState(false);
  const resultRef = useRef(null);

  const startPick = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow Photos to analyze a picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res?.assets?.[0]?.uri) {
      setBusy(true);
      try {
        // Expect analyzeAsync(uri) -> { scan: {...} } with normalized 0..1 fields we agreed on
        const out = await analyzeAsync(res.assets[0].uri);
        if (!out?.scan) {
          Alert.alert('No face detected', 'Try a brighter, front-facing photo.');
          return;
        }
        setScan(out.scan);
      } catch (e) {
        Alert.alert('Analysis error', 'Could not analyze that photo.');
      } finally {
        setBusy(false);
      }
    }
  }, []);

  useEffect(() => {
    // When we have a scan, compute personalization + route to result
    (async () => {
      if (!scan) return;
      setBusy(true);
      try {
        const { x } = buildScannerVector(
          {
            dryness: scan.dryness,
            splitEnds: scan.splitEnds,
            scalpOil: scan.scalpOil,
            frizz: scan.frizz,
            shine: scan.shine,
            colorDamage: scan.colorDamage,
            breakage: scan.breakage,
            hairLength: scan.hairLength,     // 'pixie' | 'bob' | 'shoulder' | 'long'
            hairTexture: scan.hairTexture,   // 'straight' | 'wavy' | 'curly' | 'coily'
            dyedRecentlyDays: scan.dyedRecentlyDays ?? 0,
          },
          env,
          settings?.userProfile?.hairHabits || { washPerWeek: 4, heatStylePerWeek: 2, chemicalTreatFreq: 0 }
        );

        // Heuristic baseline
        const heuristic = (
          (scan.dryness || 0) * 0.35 +
          (scan.splitEnds || 0) * 0.35 +
          (scan.colorDamage || 0) * 0.30
        );
        const ml = await predict(x);
        const blended = await blendScores(heuristic, ml, 0.6); // 60% ML, 40% heuristic
        const needPct = Math.round(blended * 100);

        track('scanner_computed', { blended, ml, heuristic, needPct }, { enabled: settings.shareAnonymizedStats });

        resultRef.current = { x, blended, ml, heuristic, needPct, scan };

        if (blended >= BAD_THRESHOLD) {
          // Recovery path
          navigation.replace('HairScanResultDynamic', {
            needPct,
            details: scan,
          });
          // implicit weak positive when they reach recovery result (they engaged)
          queueLabel(x, 1, 'weak_pos', { enabled: settings.shareAnonymizedStats });
        } else {
          // Good path
          navigation.replace('HairScanResultDynamic', {
            needPct,
            details: scan,
          });
          // implicit weak negative for "recovery" (they don't need it)
          queueLabel(x, 0, 'weak_neg', { enabled: settings.shareAnonymizedStats });
        }
      } catch (err) {
        Alert.alert('Scan error', 'There was a problem computing your result.');
      } finally {
        setBusy(false);
      }
    })();
  }, [scan]);

  return (
    <View style={s.container}>
      <Text style={s.h1}>Hair Health Scanner</Text>
      <Text style={s.sub}>Pick a clear, front-facing photo in good lighting.</Text>

      <TouchableOpacity style={s.btn} onPress={startPick} disabled={busy}>
        <Ionicons name="images-outline" size={18} color="#111" />
        <Text style={s.btnTxt}>Choose Photo</Text>
      </TouchableOpacity>

      {busy && (
        <View style={{ marginTop: 14, flexDirection:'row', alignItems:'center', gap:10 }}>
          <ActivityIndicator />
          <Text style={{ color:'#666' }}>Analyzing…</Text>
        </View>
      )}

      {!scan && !busy && (
        <View style={s.card}>
          <Text style={{ color:'#111' }}>
            Tip: Pull hair away from face, look straight ahead, and ensure even lighting.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:16 },
  h1: { fontSize:22, fontWeight:'800', color:'#111' },
  sub: { color:'#666', marginTop:6 },
  btn: { marginTop:14, borderWidth:1, borderColor:'#111', borderRadius:12, paddingVertical:12, paddingHorizontal:16, flexDirection:'row', alignItems:'center', gap:10, alignSelf:'flex-start' },
  btnTxt: { fontWeight:'800', color:'#111' },
  card: { marginTop:16, borderWidth:1, borderColor:'#eee', backgroundColor:'#fff', borderRadius:16, padding:12 },
});
