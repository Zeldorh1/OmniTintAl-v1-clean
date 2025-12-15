// src/screens/StyleScreen.js
import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const Chip = ({ label }) => (
  <View
    style={{
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: '#F3F4F6',
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 8,
    }}
  >
    <Text style={{ color: '#111', fontWeight: '600' }}>{label}</Text>
  </View>
);

export default function StyleScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>
          Style
        </Text>
        <Text style={{ color: '#666', marginTop: 6 }}>
          Explore looks, palettes and accessories.
        </Text>

        <View style={{ marginTop: 18, flexDirection: 'row', flexWrap: 'wrap' }}>
          {['Blondes', 'Brunettes', 'Reds', 'Fashion', 'Balayage', 'Gloss', 'Bond repair'].map(
            (c) => (
              <Chip key={c} label={c} />
            )
          )}
        </View>

        <View style={{ marginTop: 22 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              borderRadius: 16,
              backgroundColor: '#111',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FontAwesome5 name="magic" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 10 }}>
              Try Trend Radar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              borderRadius: 16,
              backgroundColor: '#F3F4F6',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <FontAwesome5 name="comments" size={18} color="#111" />
            <Text style={{ color: '#111', fontWeight: '700', marginLeft: 10 }}>
              Ask the Hair Expert
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
