import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, Alert } from 'react-native';
import { useCart } from '@/context/CartContext';
import { fetchData } from '../utils/api';

export default function Checkout(){
  const cart = useCart();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const res = await api.post('/checkout/preview', { items: cart.items, bundles: cart.bundles });
      Alert.alert('Checkout', `Server responded: $${res.data.total.toFixed(2)}`);
    } catch (e) {
      Alert.alert('Error', 'Could not reach backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight:'800', marginBottom: 8 }}>Checkout</Text>
        <Text>Total (client): ${cart.total().toFixed(2)}</Text>
        <Pressable disabled={loading} onPress={submit} style={{ marginTop: 12, backgroundColor:'#111', padding: 14, borderRadius: 14, alignItems:'center' }}>
          <Text style={{ color:'#fff', fontWeight:'800' }}>{loading ? 'Submitting...' : 'Preview on Server'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
