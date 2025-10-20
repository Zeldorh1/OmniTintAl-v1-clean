import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to OmniTintAI®️ 🚀</Text>
      <Text style={styles.subtext}>
        Intelligent Hair. Intelligent Price.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  subtext: {
    fontSize: 15,
    color: '#555',
    marginTop: 8,
  },
});
