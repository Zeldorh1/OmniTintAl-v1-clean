// client/src/screens/CartScreen.js
import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
  const nav = useNavigation();
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Your Bag</Text>
      </View>

      <View style={s.empty}>
        <FontAwesome5 name="shopping-bag" size={36} color="#9AA0A6" />
        <Text style={s.emptyTitle}>Your bag is empty</Text>
        <Text style={s.emptySub}>Save shades or add products to check out later.</Text>
        <TouchableOpacity onPress={() => nav.navigate('Home')} style={s.primaryBtn}>
          <Text style={s.primaryText}>Browse shades</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginTop: 6 },
  emptySub: { color: '#666', textAlign: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#111', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
  primaryText: { color: '#fff', fontWeight: '800' },
});
