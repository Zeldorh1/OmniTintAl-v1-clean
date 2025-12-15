import React from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext.pro';

const freeStyles = [
  { name: 'Soft Curls', img: 'https://i.imgur.com/XC6Jx7E.png' },
  { name: 'Beach Waves', img: 'https://i.imgur.com/EvTIFvC.png' },
  { name: 'Straight Flow', img: 'https://i.imgur.com/8AxMOUu.png' },
];
const premiumStyles = [
  { name: 'High Ponytail', img: 'https://i.imgur.com/l3jzKue.png' },
  { name: 'Layered Bob', img: 'https://i.imgur.com/LHDnF6P.png' },
  { name: 'Pixie Glow', img: 'https://i.imgur.com/TY9I5oA.png' },
  { name: 'Balayage Blend', img: 'https://i.imgur.com/4hZDX6O.png' },
];

export default function AISuggestedStylesPro() {
  const { subscription } = useApp();
  const isPremium = subscription?.premium;
  const data = isPremium ? [...freeStyles, ...premiumStyles] : freeStyles;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        AI-Suggested Hairstyles {isPremium ? '⭐' : '(Free Preview)'}
      </Text>

      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.img }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
          </View>
        )}
      />

      {!isPremium && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockText}>Unlock Premium to see more styles 💎</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { flex: 1, margin: 6, alignItems: 'center' },
  image: { width: 140, height: 140, borderRadius: 12, marginBottom: 6 },
  name: { color: '#fff', fontSize: 14, textAlign: 'center' },
  lockBanner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  lockText: { color: '#fff', fontSize: 13 },
});
