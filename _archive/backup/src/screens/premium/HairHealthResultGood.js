// client/src/screens/premium/HairScanResultGood.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HairScanResultGood({ route, navigation }) {
  const needPct = route?.params?.needPct ?? 0;
  const scan = route?.params?.details;

  return (
    <View style={s.container}>
      <Text style={s.h1}>Great News 🎉</Text>
      <Text style={s.sub}>Your care need score is {needPct}% — looking healthy!</Text>

      <View style={s.card}>
        <Text style={s.row}>Dryness: {pct(scan?.dryness)} • Split-ends: {pct(scan?.splitEnds)}</Text>
        <Text style={s.row}>Oil: {pct(scan?.scalpOil)} • Frizz: {pct(scan?.frizz)} • Shine: {pct(scan?.shine)}</Text>
        <Text style={s.row}>Color damage: {pct(scan?.colorDamage)} • Breakage: {pct(scan?.breakage)}</Text>
      </View>

      <Text style={{ color:'#666', marginTop:10 }}>
        You can browse accessories while you’re here.
      </Text>

      <View style={s.rowBtns}>
        <TouchableOpacity style={s.primary} onPress={() => navigation.navigate('CompareProductsScreen')}>
          <Text style={s.primaryTxt}>Browse Accessories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghost} onPress={() => navigation.navigate('Home')}>
          <Text style={s.ghostTxt}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pct = (v) => (((Number(v)||0)*100)|0)+'%';

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:16 },
  h1: { fontSize:22, fontWeight:'800', color:'#111' },
  sub: { color:'#666', marginTop:6 },
  card: { marginTop:14, borderWidth:1, borderColor:'#eee', borderRadius:16, padding:12, backgroundColor:'#fff' },
  row: { color:'#111', marginTop:4 },
  rowBtns: { flexDirection:'row', gap:10, marginTop:14 },
  primary: { backgroundColor:'#111', borderRadius:12, paddingVertical:12, paddingHorizontal:16, flex:1, alignItems:'center' },
  primaryTxt: { color:'#fff', fontWeight:'800' },
  ghost: { borderWidth:1, borderColor:'#111', borderRadius:12, paddingVertical:12, paddingHorizontal:16, flex:1, alignItems:'center' },
  ghostTxt:{ color:'#111', fontWeight:'800' },
});
