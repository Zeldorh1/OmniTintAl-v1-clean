import React from 'react';
import { View, Text, Pressable } from 'react-native';
import d from '@/theme/design';

export default function HeroCardMono({ onStart, onAR, onHealth, onMix }:{ onStart?:()=>void; onAR?:()=>void; onHealth?:()=>void; onMix?:()=>void }){
  return (
    <View style={[d.shadow.card, { backgroundColor: d.colors.card, borderRadius: d.radius.xl, padding: 18, borderWidth:1, borderColor: d.colors.border }]}>
      <Text style={[d.fonts.h1, { color: d.colors.text, marginBottom: 6 }]}>Find your perfect shade</Text>
      <Text style={[d.fonts.p, { color: d.colors.muted, marginBottom: 14 }]}>Preview in AR and compare formulas instantly.</Text>
      <Pressable onPress={onStart} style={{ borderWidth:1.5, borderColor: d.colors.text, paddingVertical:12, paddingHorizontal:16, alignSelf:'flex-start', borderRadius: d.radius.lg }}>
        <Text style={{ fontWeight:'800', color: d.colors.text }}>Start Try‑On</Text>
      </Pressable>
      <View style={{ flexDirection:'row', marginTop: 12 }}>
        <Pressable onPress={onAR} style={{ borderWidth:1, borderColor: d.colors.border, paddingVertical:10, paddingHorizontal:12, borderRadius: d.radius.lg, marginRight:10 }}>
          <Text>Try‑On 360°</Text>
        </Pressable>
        <Pressable onPress={onHealth} style={{ borderWidth:1, borderColor: d.colors.border, paddingVertical:10, paddingHorizontal:12, borderRadius: d.radius.lg, marginRight:10 }}>
          <Text>Hair Health</Text>
        </Pressable>
        <Pressable onPress={onMix} style={{ borderWidth:1, borderColor: d.colors.border, paddingVertical:10, paddingHorizontal:12, borderRadius: d.radius.lg }}>
          <Text>Mix Pro</Text>
        </Pressable>
      </View>
    </View>
  );
}
