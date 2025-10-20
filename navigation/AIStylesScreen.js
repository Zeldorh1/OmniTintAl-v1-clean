// client/src/screens/premium/AIStylesScreen.js
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { suggestStyles } from '../../utils/aiStyles';

export default function AIStylesScreen({ route, navigation }) {
  // Optional: profile can be passed from HairHealthScanner later
  const profile = route?.params?.profile ?? {
    faceShape: 'oval',
    undertone: 'neutral',
    lengthPref: 'any',
  };

  const data = useMemo(() => suggestStyles(profile), [profile]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <Text style={s.h1}>AI Suggested Styles</Text>
            <Text style={s.sub}>
              Local, on-device suggestions. No photos are uploaded.
            </Text>
          </View>
        }
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={s.iconWrap}>
                <FontAwesome5 name={item.icon} size={16} color="#111" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.name}</Text>
                <Text style={s.meta}>
                  {item.length} • {item.vibe} • {item.maintenance}
                </Text>
                {!!item.desc && <Text style={s.desc}>{item.desc}</Text>}
              </View>
            </View>

            <View style={s.rowBtns}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ARStudio', { preset: item })}
                style={[s.btn, { backgroundColor: '#111' }]}
              >
                <FontAwesome5 name="camera" size={12} color="#fff" />
                <Text style={[s.btnText, { color: '#fff' }]}>Try in AR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('CompareProductsScreen', { styleId: item.id })}
                style={[s.btn, { backgroundColor: '#F1F1F1' }]}
              >
                <FontAwesome5 name="shopping-bag" size={12} color="#111" />
                <Text style={[s.btnText, { color: '#111' }]}>Recommended Products</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '800', color: '#111' },
  sub: { color: '#6B7280', marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#F9FAFB',
  },
  title: { fontWeight: '800', color: '#111', fontSize: 16 },
  meta: { color: '#6B7280', marginTop: 2 },
  desc: { color: '#4B5563', marginTop: 6 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnText: { fontWeight: '800', fontSize: 12 },
});
