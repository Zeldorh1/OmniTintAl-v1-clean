import React from 'react';
import { View, Text, Pressable } from 'react-native';
import d from '@/theme/design';

export default function HeroCard({ onStart, onAR, onHealth, onMix }:{ onStart?:()=>void; onAR?:()=>void; onHealth?:()=>void; onMix?:()=>void }){
  return (
    <View style={{
      backgroundColor: d.colors.brand, borderRadius: d.radius.xl, padding: 18, marginBottom: 16
    }}>
      <Text style={[d.fonts.h1, { color:'#1F2937', marginBottom: 4 }]}>Find your perfect shade</Text>
      <Text style={[d.fonts.p, { color:'#1F2937', marginBottom: 12 }]}>Preview in AR and compare formulas instantly.</Text>
      <Pressable onPress={onStart} style={{ backgroundColor:'#F7F7F7', paddingVertical:12, paddingHorizontal:16, alignSelf:'flex-start', borderRadius: d.radius.lg }}>
        <Text style={{ fontWeight:'800' }}>Start Try‑On</Text>
      </Pressable>
      {/* Quick actions */}
      <View style={{ flexDirection:'row', marginTop: 12 }}>
        <Pressable onPress={onAR} style={{ backgroundColor:'#fff', paddingVertical:10, paddingHorizontal:12, borderRadius: d.radius.lg, marginRight:10 }}>
          <Text>Try‑On 360°</Text>
        </Pressable>
        <Pressable onPress={onHealth} style={{ backgroundColor:'#fff', paddingVertical:10, paddingHorizontal:12, borderRadius: d.radius.lg, marginRight:10 }}>
          <Text>Hair Health</Text>
        </Pressable>
        <Pressable onPress={onMix} style={{ backgroundColor:'#fff', paddingVertical:10, paddingHorizontal:12, borderRadius: d.radius.lg }}>
          <Text>Mix Pro</Text>
        </Pressable>
      </View>
    </View>
  );
}
