import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TrendRadarScreen() {
  const nav = useNavigation();
  const [range, setRange] = useState('Now');

  // --- Cute radar pulse animation (no extra libs) ---
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();

    loop(pulse1, 0);
    loop(pulse2, 600);
  }, [pulse1, pulse2]);

  const scales = (v) => v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const fades  = (v) => v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  // --- Mock signals / cards (replace with API later) ---
  const hashtags = ['#coolash', '#copperglow', '#bondrepair', '#heatlesscurls'];
  const looks = useMemo(() => ([
    { id: 'a', emoji: '❄️', title: 'Cool Ash',      blurb: 'Blondes' },
    { id: 'b', emoji: '🌰', title: 'Rich Brunette', blurb: 'Depth & shine' },
    { id: 'c', emoji: '🍯', title: 'Honey Gold',    blurb: 'Warm, soft' },
    { id: 'd', emoji: '💜', title: 'Violet Crush',  blurb: 'Brass away' },
  ]), []);

  const dailyPick = { emoji: '✨', name: 'AI Pick: “Soft Beige Blonde”', brand: 'OmniBlend' };

  const goCompare = () => nav.navigate('CompareProductsScreen', { source: 'TrendRadar', range });
  const goBundles = () => nav.navigate('ProductBundleScreen', { source: 'TrendRadar' });

  return (
    <SafeAreaView style={styles.wrap}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Trend Radar</Text>
          <View style={styles.countryPill}><Text style={styles.countryText}>🇺🇸 United States</Text></View>
</View>

        {/* Range chips */}
        <View style={styles.rangeRow}>
          {['Now','7d','30d','90d'].map(r => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[styles.chip, r === range && styles.chipActive]}
            >
              <Text style={[styles.chipText, r === range && styles.chipTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        {/* Radar Card (cute + techy) */}
        <View style={styles.radarCard}>
          <View style={styles.radarWrap}>
            {/* center dot */}
            <View style={styles.centerDot} />
            {/* static rings */}
            <View style={[styles.ring, { width: 220, height: 220 }]} />
            <View style={[styles.ring, { width: 160, height: 160 }]} />
            <View style={[styles.ring, { width: 100, height: 100 }]} />
            {/* animated pulses */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulse,
                {
                  transform: [{ scale: scales(pulse1) }],
                  opacity: fades(pulse1),
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulse,
                {
                  transform: [{ scale: scales(pulse2) }],
                  opacity: fades(pulse2),
                },
              ]}
            />
            {/* playful signal dots */}
            {[
              { left: 18, top: 50 },
              { right: 22, top: 36 },
              { left: 60, bottom: 28 },
              { right: 70, bottom: 40 },
            ].map((p, i) => (
              <View key={i} style={[styles.dot, p]} />
            ))}
          </View>

          {/* Hashtag strip */}
          <View style={styles.tagsRow}>
            {hashtags.map(tag => (
              <View key={tag} style={styles.tagBubble}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable style={styles.primaryBtn} onPress={goCompare}>
              <FontAwesome5 name="magic" size={14} color="#fff" />
              <Text style={styles.primaryText}>  Compare Products</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={goBundles}>
              <Ionicons name="sparkles-outline" size={16} color="#111" />
              <Text style={styles.secondaryText}>  See Bundles</Text>
            </Pressable>
          </View>
        </View>

        {/* Carousel: looks catching fire */}
        <Text style={styles.sectionTitle}>Catching Fire</Text>
        <FlatList
          data={looks}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.lookCard} onPress={goCompare}>
              <Text style={styles.lookEmoji}>{item.emoji}</Text>
              <Text style={styles.lookTitle}>{item.title}</Text>
              <Text style={styles.lookBlurb}>{item.blurb}</Text>
            </Pressable>
          )}
        />

        {/* Daily pick */}
        <Text style={styles.sectionTitle}>Daily Pick</Text>
        <View style={styles.dailyCard}>
          <View style={styles.dailyLeft}>
            <Text style={styles.dailyEmoji}>{dailyPick.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dailyName}>{dailyPick.name}</Text>
            <Text style={styles.dailyBrand}>{dailyPick.brand}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable style={styles.smallPrimary} onPress={goCompare}>
                <Text style={styles.smallPrimaryText}>Compare</Text>
              </Pressable>
              <Pressable style={styles.smallGhost} onPress={goBundles}>
                <Text style={styles.smallGhostText}>Shop Ideas</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.note}>Signals are playful previews. Live U.S. data coming soon.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#FFFFFF';
const PAPER = '#F9F9F7';

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: PAPER },
  headerRow: {
    paddingHorizontal: 20, paddingTop: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111' },
  countryPill: { backgroundColor: '#EEF1F5', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  countryText: { fontSize: 12, fontWeight: '700', color: '#333' },

  rangeRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  chip: { borderWidth: 1, borderColor: '#E6E6E6', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#222' },
  chipTextActive: { color: '#fff' },

  radarCard: {
    backgroundColor: CARD_BG, borderRadius: 24, marginHorizontal: 20, marginTop: 14, padding: 16,
    borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2
  },
  radarWrap: {
    width: 240, height: 240, borderRadius: 999, alignSelf: 'center', backgroundColor: '#FAFAFA',
    justifyContent: 'center', alignItems: 'center', marginVertical: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#EDEDED'
  },
  ring: {
    position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: '#EAEAEA'
  },
  centerDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#111' },
  pulse: {
    position: 'absolute', width: 240, height: 240, borderRadius: 999, backgroundColor: '#111'
  },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 999, backgroundColor: '#111' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'center', marginTop: 12 },
  tagBubble: { backgroundColor: '#F1F1F1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontWeight: '700', fontSize: 12, color: '#333' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14, justifyContent: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderColor: '#DFDFDF', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 12 },
  secondaryText: { color: '#111', fontWeight: '800', fontSize: 14 },

  sectionTitle: { paddingHorizontal: 20, paddingTop: 18, fontSize: 20, fontWeight: '800', color: '#111' },
  lookCard: { width: 150, backgroundColor: '#FFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#EEE' },
  lookEmoji: { fontSize: 28 },
  lookTitle: { fontWeight: '800', fontSize: 15, color: '#111', marginTop: 8 },
  lookBlurb: { color: '#777', fontSize: 12, marginTop: 4 },

  dailyCard: {
    backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 20, marginTop: 14, padding: 16,
    borderWidth: 1, borderColor: '#EEE', flexDirection: 'row', gap: 12, alignItems: 'center'
  },
  dailyLeft: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F5F0E9', alignItems: 'center', justifyContent: 'center' },
  dailyEmoji: { fontSize: 26 },
  dailyName: { fontWeight: '800', color: '#111', fontSize: 16 },
  dailyBrand: { color: '#8b8b8b', fontSize: 12, marginTop: 2 },

  smallPrimary: { backgroundColor: '#000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  smallPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  smallGhost: { borderWidth: 1, borderColor: '#DCDCDC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff' },
  smallGhostText: { color: '#111', fontWeight: '800', fontSize: 12 },

  note: { textAlign: 'center', color: '#888', fontSize: 12, marginTop: 14 }
});
