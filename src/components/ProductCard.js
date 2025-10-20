import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import colors from '@/theme/colors';
import type { Product } from '@/data/types';
import { productImages } from '@/utils/images';
import { useFavs } from '@/context/FavoritesContext';

export default function ProductCard({ product, onPress }:{ product: Product, onPress: () => void }){
  const favs = useFavs();
  const src = product.image && productImages[product.image] ? productImages[product.image] : productImages['blonde.png'];

  return (
    <Pressable onPress={onPress} style={{ backgroundColor: colors.card, padding: 14, borderRadius: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={src} style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: '#eee' }} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontWeight: '800' }}>{product.name}</Text>
          <Text style={{ color: colors.muted }}>{product.brand}</Text>
          <Text>${product.price.toFixed(2)}</Text>
        </View>
        <Pressable onPress={() => favs.toggle(product)}>
          <Text style={{ fontWeight:'800', color: favs.isFav(product.id) ? colors.gold : colors.muted }}>♥</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
