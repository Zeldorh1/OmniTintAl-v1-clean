// client/src/screens/premium/CartScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASSOCIATE_TAG } from '../config/affiliate';

const BAG_KEY = '@omnitintai:bag';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => { loadBag(); }, []);

  const loadBag = async () => {
    try {
      const raw = await AsyncStorage.getItem(BAG_KEY);
      const bag = raw ? JSON.parse(raw) : [];
      setItems(bag);
    } catch (e) {
      console.log('Bag load error', e);
    }
  };

  const removeItem = async (asin: string) => {
    const updated = items.filter(i => i.asin !== asin);
    await AsyncStorage.setItem(BAG_KEY, JSON.stringify(updated));
    setItems(updated);
  };

  const buildAmazonCartUrl = () => {
    if (!items.length) return null;
    let url = 'https://www.amazon.com/gp/aws/cart/add.html?';
    items.forEach((item, index) => {
      url += `ASIN.\( {index + 1}= \){item.asin}&Quantity.${index + 1}=1&`;
    });
    url += `AssociateTag=${ASSOCIATE_TAG}`;
    return url;
  };

  const goToAmazonCart = () => {
    const url = buildAmazonCartUrl();
    if (url) Linking.openURL(url);
    else Alert.alert('Empty', 'Your bag is empty');
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.item}>
      <Image source={{ uri: item.image }} style={s.itemImage} />
      <View style={s.itemInfo}>
        <Text style={s.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.itemPrice}>{item.price || 'Check price'}</Text>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.asin)}>
        <Text style={s.remove}>×</Text>
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>Your Bag</Text>
        </View>
        <View style={s.empty}>
          <FontAwesome5 name="shopping-bag" size={36} color="#9AA0A6" />
          <Text style={s.emptyTitle}>Your bag is empty</Text>
          <Text style={s.emptySub}>Save products to buy later.</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CompareProductsScreen')}
            style={s.primaryBtn}
          >
            <Text style={s.primaryText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Your Bag ({items.length})</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.asin}
        renderItem={renderItem}
        contentContainerStyle={s.list}
      />

      <View style={s.footer}>
        <TouchableOpacity style={s.amazonBtn} onPress={goToAmazonCart}>
          <Text style={s.amazonText}>Continue to Amazon Cart</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          As an Amazon Associate, we earn from qualifying purchases.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ... same styles as your current file ...
