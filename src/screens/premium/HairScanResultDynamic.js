// client/src/screens/premium/HairScanResultDynamic.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { evaluateScan } from '../../utils/hairRules';
import { buildScannerVector } from '../../utils/scannerFeatures';
import { predict, blendScores, learn } from '../../utils/personalizer';
import { queueLabel, track } from '../../utils/telemetry';
import { useSettings } from '../../context/SettingsContext';

export default function HairScanResultDynamic({ navigation, route }) {
  const { settings } = useSettings();
  const scan = route?.params?.scan || route?.params?.details || {};
  const env  = route?.params?.env  || { lux: 0.6, expoBias: 0, blur: 0.1 };

  const [score, setScore] = useState(null);
  const vectorRef = useRef(null);

  const evald = useMemo(() => evaluateScan(scan), [scan]);

  useEffect(() => {
    (async () => {
      // Build vector & blended need score
      const { x } = buildScannerVector(
        {
          dryness: scan.dryness,
          splitEnds: scan.splitEnds,
          scalpOil: scan.scalpOil,
          frizz: scan.frizz,
          shine: scan.shine,
          colorDamage: scan.colorDamage,
          breakage: scan.breakage,
          hairLength: scan.hairLength,
          hairTexture: scan.hairTexture,
          dyedRecentlyDays: scan.dyedRecentlyDays ?? 0,
        },
        env,
        settings?.userProfile?.hairHabits || { washPerWeek: 4, heatStylePerWeek: 2, chemicalTreatFreq: 0 }
      );
      vectorRef.current = x;

      const heuristic = evald.overall; // 0..1 from hairRules
      const ml = await predict(x);
      const blended = await blendScores(heuristic, ml, 0.6);
      const needPct = Math.round(blended * 100);
      setScore({ blended, ml, heuristic, needPct });

      track('scanner_result_dynamic', { blended, ml, heuristic, needPct }, { enabled: settings.shareAnonymizedStats });
    })();
  }, [scan]);

  const onThumb = async (y) => {
    if (!vectorRef.current) return;
    await learn(vectorRef.current, y);
    await queueLabel(vectorRef.current, y, 'strong', { enabled: settings.shareAnonymizedStats });
    Alert.alert(y ? 'Thanks!' : 'Noted', y ? 'We’ll tune future suggestions.' : 'We’ll avoid similar recs.');
  };

  const goBundles = () => {
    // implicit weak positive (engaged)
    if (vectorRef.current) queueLabel(vectorRef.current, 1, 'weak_pos', { enabled: settings.shareAnonymizedStats });
    navigation.navigate('ProductBundleScreen', {
      from: 'HairScan',
      filters: evald?.cta?.bundleFilters || [],
      accessoryMode: !!evald?.cta?.accessoryMode,
      scan, // pass full scan if your bundle page uses it
    });
  };

  const goStyles = () => navigation.navigate('AIStylesScreen');
  const goAR360  = () => navigation.navigate('AR360PreviewScreen');

  const Sev = ({ level }) => {
    const map = { mild:'#7bc67b', moderate:'#f2b84b', high:'#e66565' };
    return (
      <View style={[styles.sevChip, { backgroundColor: map[level] || '#999' }]}>
        <Text style={{ color:'#fff', fontWeight:'800', fontSize:12 }}>{level.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.h1}>Your Hair Scan</Text>
      {score && (
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Care need score</Text>
          <Text style={styles.metricValue}>{score.needPct}%</Text>
          <Text style={styles.metricSub}>ML: {(score.ml*100|0)}% • Heuristic: {(score.heuristic*100|0)}%</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.h2}>What we noticed</Text>
        {evald.issues.length === 0 && (
          <Text style={{ color:'#444', marginTop:8 }}>Looks great overall! Consider maintenance and protection.</Text>
        )}
        {evald.issues.map((it) => (
          <View key={it.key} style={styles.issue}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
              <Text style={styles.issueTitle}>{it.title}</Text>
              <Sev level={it.level} />
            </View>
            {it.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color="#111" />
                <Text style={styles.tipTxt}>{tip}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.rowBtns}>
        <TouchableOpacity style={styles.primary} onPress={goBundles}>
          <Text style={styles.primaryTxt}>View Care Bundle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghost} onPress={goStyles}>
          <Text style={styles.ghostTxt}>AI Styles</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.ghost, { marginTop:10 }]} onPress={goAR360}>
        <Text style={styles.ghostTxt}>Try in 360°</Text>
      </TouchableOpacity>

      <View style={styles.feedback}>
        <TouchableOpacity style={styles.thumbUp} onPress={() => onThumb(1)}>
          <Text style={styles.thumbTxt}>👍 Accurate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.thumbDown} onPress={() => onThumb(0)}>
          <Text style={styles.thumbDownTxt}>👎 Off</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff', padding:16 },
  h1:{ fontSize:22, fontWeight:'800', color:'#111' },
  h2:{ fontSize:18, fontWeight:'700', color:'#111', marginTop:6 },
  metric:{ marginTop:12, borderWidth:1, borderColor:'#eee', borderRadius:16, padding:14 },
  metricLabel:{ color:'#666', fontWeight:'600' },
  metricValue:{ fontSize:26, fontWeight:'900', color:'#111', marginTop:4 },
  metricSub:{ color:'#777', marginTop:2 },
  section:{ marginTop:16 },
  issue:{ borderWidth:1, borderColor:'#eee', borderRadius:14, padding:12, marginTop:10 },
  issueTitle:{ fontWeight:'800', color:'#111' },
  sevChip:{ paddingVertical:4, paddingHorizontal:10, borderRadius:999 },
  tipRow:{ flexDirection:'row', alignItems:'center', gap:8, marginTop:8 },
  tipTxt:{ color:'#111', flex:1 },
  rowBtns:{ flexDirection:'row', gap:10, marginTop:14 },
  primary:{ backgroundColor:'#111', borderRadius:12, paddingVertical:12, paddingHorizontal:16, flex:1, alignItems:'center' },
  primaryTxt:{ color:'#fff', fontWeight:'800' },
  ghost:{ borderWidth:1, borderColor:'#111', borderRadius:12, paddingVertical:12, paddingHorizontal:16, alignItems:'center' },
  ghostTxt:{ color:'#111', fontWeight:'800' },
  feedback:{ flexDirection:'row', justifyContent:'space-evenly', marginTop:18 },
  thumbUp:{ backgroundColor:'#111', borderRadius:12, paddingVertical:10, paddingHorizontal:18 },
  thumbTxt:{ color:'#fff', fontWeight:'700' },
  thumbDown:{ borderWidth:1, borderColor:'#111', borderRadius:12, paddingVertical:10, paddingHorizontal:18 },
  thumbDownTxt:{ color:'#111', fontWeight:'700' },
});
