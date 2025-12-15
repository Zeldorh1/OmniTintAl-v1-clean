import React from 'react';
import { Pressable, Text } from 'react-native';
import d from '@/theme/design';
export default function Chip({ label, active=false, onPress }:{ label:string; active?:boolean; onPress?:()=>void }){
  return (
    <Pressable onPress={onPress} style={{
      backgroundColor: active ? '#111827' : d.colors.chip,
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: d.radius.pill, marginRight: 8
    }}>
      <Text style={{ color: active ? '#fff' : d.colors.chipText, fontWeight:'700' }}>{label}</Text>
    </Pressable>
  );
}
