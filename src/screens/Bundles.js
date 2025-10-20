import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, SafeAreaView } from 'react-native';
import bundles from '@/data/bundles.json';
import products from '@/data/products.json';
import { useCart } from '@/context/CartContext';

export default function Bundles(){
  const cart = useCart();
  const productMap = useMemo(() => new Map((products as any).map((p:any)=>[p.id,p])), []);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Bundle Packages</Text>
        <FlatList
          data={bundles as any}
          keyExtractor={(b)=>b.id}
          renderItem={({ item }) => (
            <View style={{ backgroundColor:'#fafafa', padding: 14, borderRadius: 14, marginBottom: 12 }}>
              <Text style={{ fontWeight:'800' }}>{item.name}</Text>
              <Text style={{ marginVertical: 6 }}>{item.description}</Text>
              <Text>Includes:</Text>
              {(item.items as string[]).map(id => <Text key={id}>• {productMap.get(id)?.name}</Text>)}
              <Pressable onPress={() => cart.addBundle(item)} style={{ marginTop: 10, backgroundColor:'#FFDA79', padding: 12, borderRadius: 12, alignItems:'center' }}>
                <Text style={{ fontWeight:'800' }}>Add Bundle • ${item.price.toFixed(2)}</Text>
              </Pressable>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
