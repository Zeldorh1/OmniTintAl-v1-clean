import React, { useMemo } from 'react';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import products from '@/data/products.json';
import { useCart } from '@/context/CartContext';
import colors from '@/theme/colors';

export default function ProductDetails(){
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const id = route.params?.id;
  const product = useMemo(() => (products as any).find((p:any)=>p.id===id), [id]);
  const cart = useCart();

  if(!product){ return <SafeAreaView><Text>Product not found.</Text></SafeAreaView> }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '800' }}>{product.name}</Text>
        <Text style={{ color: colors.muted, marginBottom: 12 }}>{product.description}</Text>
        <View style={{ height: 100, borderRadius: 12, backgroundColor: product.hex || '#eee', marginBottom: 16 }} />
        <Pressable onPress={() => { cart.add(product); nav.navigate('Cart'); }} 
          style={{ backgroundColor: colors.accent, padding: 14, borderRadius: 14, alignItems:'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Add to Basket • ${product.price.toFixed(2)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
