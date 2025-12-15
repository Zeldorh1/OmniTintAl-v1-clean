// client/src/screens/Favorites.js
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

// ────── CONTEXTS ──────
import { useFavs } from '../context/FavoritesContext';
import { useThemePro } from '../context/ThemeContext';

// ────── OPTIONAL CARD COMPONENT ──────
let FavoriteCard = null;
try {
  // If you have a custom card component, it will be used
  FavoriteCard = require('../components/FavoritesCard').default;
} catch (_) {
  FavoriteCard = null;
}

// ────── MAIN SCREEN ──────
export default function Favorites() {
  const nav = useNavigation();
  const favs = useFavs?.() || {};
  const { colors } = useThemePro();

  // Normalize favorites list
  const items = useMemo(() => {
    if (Array.isArray(favs?.items)) return favs.items;
    if (typeof favs?.list === 'function') return favs.list() || [];
    return [];
  }, [favs]);

  // Remove from favorites
  const removeFavorite = (item) => {
    const id = item?.id ?? item?.asin ?? item?.sku;
    if (favs?.remove) favs.remove(id);
    else if (favs?.toggle) favs.toggle(item);
  };

  // Simple “heart” that does NOT require vector-icon fonts
  const Heart = ({ size = 20, color }) => (
    <Text style={{ fontSize: size, color, includeFontPadding: false }}>❤</Text>
  );

  // Fallback card if FavoriteCard not found
  const renderFallbackCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card ?? '#fff' }]}
        onPress={() => nav.navigate('ProductDetails', { product: item })}
        activeOpacity={0.85}
      >
        {item?.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}

        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {item?.title ?? 'Saved item'}
          </Text>
          {!!item?.brand && (
            <Text numberOfLines={1} style={[styles.brand, { color: colors.mute }]}>
              {item.brand}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => removeFavorite(item)}
          hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
          style={{ paddingLeft: 10, paddingVertical: 6 }}
        >
          <Heart size={20} color={colors.heart ?? '#E53935'} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Use custom FavoriteCard if exists, else fallback
  const renderItem = ({ item }) =>
    FavoriteCard ? (
      <FavoriteCard
        item={item}
        onPress={() => nav.navigate('ProductDetails', { product: item })}
        onRemove={() => removeFavorite(item)}
        heartColor={colors.heart}
      />
    ) : (
      renderFallbackCard({ item })
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>Favorites</Text>
        <Text style={[styles.sub, { color: colors.mute }]}>
          Your saved shades & products
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 34, marginBottom: 12, color: '#ccc' }}>❤</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No favorites yet</Text>
          <Text style={[styles.emptyText, { color: colors.mute }]}>
            Tap the heart on any product to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => String(it?.id ?? it?.asin ?? it?.sku ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ────── STYLES ──────
const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
  },
  sub: {
    marginTop: 4,
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginHorizontal: 2,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 14,
  },
  thumbPlaceholder: {
    backgroundColor: '#F0F0F0',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  brand: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});
