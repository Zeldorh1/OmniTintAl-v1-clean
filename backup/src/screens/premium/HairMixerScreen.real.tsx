import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HairMixerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✨ Hair Mixer Pro Coming Soon ✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: 'gold', fontSize: 20, fontWeight: 'bold' },
});
