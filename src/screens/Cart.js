import React from 'react';
import { View, Text, FlatList, Pressable, SafeAreaView } from 'react-native';
import { useCart } from '@/context/CartContext';
import { colors } from '../theme/colors';

export default function Cart(){
  const cart = useCart();

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Your Basket</Text>
        <FlatList
          data={cart.items}
          keyExtractor={(i)=>i.product.id}
          renderItem={({ item }) => (
            <View style={{ padding: 12, backgroundColor: '#fafafa', borderRadius: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight:'700' }}>{item.product.name}</Text>
              <Text style={{ color: colors.muted }}>Qty: {item.qty}</Text>
              <Text>${(item.product.price * item.qty).toFixed(2)}</Text>
              <Pressable onPress={() => cart.remove(item.product.id)}><Text style={{ color: 'tomato' }}>Remove</Text></Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: colors.muted }}>Your basket is empty.</Text>}
        />
        <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 8 }}>Total: ${cart.total().toFixed(2)}</Text>
        <Pressable onPress={() => {}} style={{ backgroundColor: colors.gold, padding: 14, borderRadius: 14, alignItems:'center', marginTop: 10 }}>
          <Text style={{ fontWeight: '800' }}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
