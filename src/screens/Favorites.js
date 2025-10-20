// src/screens/Favorites.js
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

// paths are from /src/screens/Favorites.js to siblings
import { useFavs } from '../context/FavoritesContext';
let FavoriteCard; // optional helper component if you already have one
try {
  // If you have src/components/FavoriteCard.js this will be used automatically.
  FavoriteCard = require('../components/FavoriteCard').default;
} catch (_) {}

export default function Favorites() {
  const favs = useFavs?.() || {};
  const nav = useNavigation();

  // Be compatible with either favs.items (array) OR favs.list() (function)
  const items = useMemo(() => {
    if (Array.isArray(favs?.items)) return favs.items;
    if (typeof favs?.list === 'function') return favs.list() || [];
    return [];
  }, [favs]);

  const renderFallbackCard = ({ item }) => {
    const isFav = typeof favs?.isFavorite === 'function'
      ? favs.isFavorite(item?.id ?? item?.asin ?? item?.sku)
      : true;

    const removeOne = () => {
      // try common method names without breaking if missing
      favs?.remove?.(item?.id ?? item?.asin ?? item?.sku);
      favs?.toggle?.(item); // some contexts use toggle
    };

    return (
      <View style={styles.card}>
        {item?.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}

        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>
            {item?.title ?? 'Saved item'}
          </Text>
          {!!item?.brand && (
            <Text numberOfLines={1} style={styles.brand}>
              {item.brand}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={removeOne} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
          <FontAwesome5
            name={isFav ? 'heart' : 'heart'}
            size={18}
            color={isFav ? '#E53935' : '#E53935'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = (args) =>
    FavoriteCard ? <FavoriteCard {...args} onPress={() => {}} /> : renderFallbackCard(args);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={styles.header}>Favorites</Text>
        <Text style={styles.sub}>Your saved shades & products</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <FontAwesome5 name="heart" size={28} color="#bbb" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>Tap the heart on any product to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => String(it?.id ?? it?.asin ?? it?.sku ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 28, fontWeight: '800', color: '#111' },
  sub: { color: '#7A7A7A', marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  thumb: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  thumbPlaceholder: { backgroundColor: '#F0F0F0' },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  brand: { fontSize: 13, color: '#666', marginTop: 2 },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptyText: { marginTop: 6, color: '#7A7A7A', textAlign: 'center' },
});
