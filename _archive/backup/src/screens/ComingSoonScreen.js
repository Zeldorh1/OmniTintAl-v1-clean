// client/src/screens/ComingSoonScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ComingSoonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✨ Premium Menu Coming Soon ✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700', // gold/yellow text
  },
});
