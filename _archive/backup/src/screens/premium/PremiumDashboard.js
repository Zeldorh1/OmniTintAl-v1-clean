// src/screens/premium/PremiumDashboard.js
import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

export default function PremiumDashboard() {
  const nav = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#111' }}>
          Premium Dashboard
        </Text>
        <Text style={{ marginTop: 8, color: '#666', fontSize: 16 }}>
          Explore premium features below 👇
        </Text>

        <TouchableOpacity
          onPress={() => nav.navigate('HairHealthScannerScreen')}
          style={{
            marginTop: 24,
            backgroundColor: '#111',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome5 name="microscope" size={18} color="#fff" />
          <Text
            style={{
              color: '#fff',
              fontWeight: '700',
              marginLeft: 10,
              fontSize: 16,
            }}
          >
            Start Hair Health Scanner
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
