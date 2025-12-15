// client/src/screens/premium/TintReorderScreen.tsx
// FINAL · FLAGSHIP · ROOT TOUCH-UP REORDER SCREEN

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadEntries, getLatest, toInches } from '../../utils/progressStorage';
import { API_URL } from '../../config/api';

const BAG_KEY = '@omnitintai:bag';

export default function TintReorderScreen() {
  const navigation = useNavigation();

  const [rootLength, setRootLength] = useState<string>('—');
  const [product, setProduct] = useState<any>(null);
  const [inBag, setInBag] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1. Get latest hair length from progress
        const entries = await loadEntries();
        const latest = getLatest(entries);
        if (latest) {
          const lengthIn = toInches(latest.length, latest.unit);
          // Estimated visible roots (a bit less than total length)
          setRootLength((lengthIn * 0.72).toFixed(1));
        }

        // 2. Last known shade (set elsewhere in the app)
        const lastShade =
          (await AsyncStorage.getItem('@omnitintai:last_shade')) || 'dark brown';

        // 3. Real Amazon product via your secure worker
        const res = await fetch(
          `${API_URL}/api/recolor-root?shade=${encodeURIComponent(lastShade)}`
        );
        const data = await res.json();
        setProduct(data);

        // 4. Check if already in bag
        const bagRaw = await AsyncStorage.getItem(BAG_KEY);
        const bag = bagRaw ? JSON.parse(bagRaw) : [];
        setInBag(bag.some((p: any) => p.asin === data.asin));
      } catch (e) {
        console.warn('[TintReorder] error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addToBag = async () => {
    if (!product) return;
    const bagRaw = await AsyncStorage.getItem(BAG_KEY);
    const bag = bagRaw ? JSON.parse(bagRaw) : [];
    if (!bag.some((p: any) => p.asin === product.asin)) {
      bag.push(product);
      await AsyncStorage.setItem(BAG_KEY, JSON.stringify(bag));
      setInBag(true);
      Alert.alert('Saved', 'Added to your bag');
    }
  };

  const goToBag = () => {
    // Make sure 'CartScreen' exists in your navigator
    // and points to your bag/cart view.
    navigation.navigate('CartScreen' as never);
  };

  const goToAmazon = () => {
    if (product?.url) {
      Linking.openURL(product.url);
    }
  };

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={s.loading}>Finding your perfect root touch-up…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.close}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={s.title}>Root Touch-Up Time</Text>
      <Text style={s.message}>
        Your visible roots are now ~{rootLength} inches
      </Text>

      {/* Visual Root Line */}
      <View style={s.hairVisual}>
        <View style={s.rootLine} />
      </View>

      {/* Product Card */}
      {product && (
        <View style={s.productCard}>
          <Image source={{ uri: product.image }} style={s.productImage} />
          <View style={s.productInfo}>
            <Text style={s.productName} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={s.productPrice}>{product.price}</Text>
          </View>
        </View>
      )}

      {/* Save to Bag Button */}
      <TouchableOpacity
        style={inBag ? s.inBagBtn : s.bagBtn}
        onPress={inBag ? goToBag : addToBag}
      >
        <FontAwesome5
          name="shopping-bag"
          size={18}
          color={inBag ? '#111' : '#FFF'}
        />
        <Text style={inBag ? s.inBagText : s.bagText}>
          {inBag ? 'In Bag' : 'Save to Bag'}
        </Text>
      </TouchableOpacity>

      {/* Buy on Amazon Button */}
      <TouchableOpacity style={s.amazonBtn} onPress={goToAmazon}>
        <Text style={s.amazonText}>Buy on Amazon</Text>
      </TouchableOpacity>

      {/* Remind Me Later */}
      <TouchableOpacity style={s.later} onPress={() => navigation.goBack()}>
        <Text style={s.laterText}>Remind Me Later</Text>
      </TouchableOpacity>

      {/* Amazon Disclosure */}
      <Text style={s.disclaimer}>
        As an Amazon Associate, we earn from qualifying purchases.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'flex-end',
  },
  close: {
    color: '#000',
    fontSize: 32,
    fontWeight: '300',
  },
  title: {
    color: '#000',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 12,
  },
  message: {
    color: '#000',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  hairVisual: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 40,
  },
  rootLine: {
    width: 80,
    height: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 60,
    height: 60,
    marginRight: 16,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  bagBtn: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  inBagBtn: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bagText: {
    color: '#FFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  inBagText: {
    color: '#111',
    fontWeight: '700',
    marginLeft: 8,
  },
  amazonBtn: {
    backgroundColor: '#FF9900',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  amazonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  later: {
    alignItems: 'center',
    marginBottom: 40,
  },
  laterText: {
    color: '#666',
    fontSize: 14,
  },
  disclaimer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
  },
  loading: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
});
