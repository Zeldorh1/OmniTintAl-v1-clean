// client/src/screens/premium/CartScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ASSOCIATE_TAG } from "../config/affiliate";

import { logBagAdded, logPurchaseRecorded } from "../brain/events";

const BAG_KEY = "@omnitintai:bag";

// ✅ Dedup store so we don’t spam events each time Cart opens
const BAG_LOGGED_KEY = "@omnitintai:bag_logged_asins_v1";

type BagItem = {
  asin: string;
  title?: string;
  image?: string;
  price?: string;
  tags?: string[];
  brand?: string;
};

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<BagItem[]>([]);

  useEffect(() => {
    loadBag();
  }, []);

  const loadBag = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BAG_KEY);
      const bag: BagItem[] = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(bag) ? bag : []);

      // ✅ Brain: log bag.added for new ASINs only (deduped)
      const loggedRaw = await AsyncStorage.getItem(BAG_LOGGED_KEY);
      const logged: Record<string, boolean> = loggedRaw ? JSON.parse(loggedRaw) : {};

      let changed = false;
      for (const it of bag) {
        const asin = String(it?.asin || "").trim();
        if (!asin) continue;

        if (!logged[asin]) {
          logged[asin] = true;
          changed = true;

          // metadata only
          await logBagAdded({
            id: asin,
            name: it.title,
            tags: Array.isArray(it.tags) ? it.tags : [],
            source: "amazon",
          });
        }
      }

      if (changed) {
        await AsyncStorage.setItem(BAG_LOGGED_KEY, JSON.stringify(logged));
      }
    } catch (e) {
      console.log("Bag load error", e);
    }
  }, []);

  const removeItem = async (asin: string) => {
    const updated = items.filter((i) => i.asin !== asin);
    await AsyncStorage.setItem(BAG_KEY, JSON.stringify(updated));
    setItems(updated);
  };

  const buildAmazonCartUrl = () => {
    if (!items.length) return null;

    const params = new URLSearchParams();

    items.forEach((item, index) => {
      const n = index + 1;
      params.set(`ASIN.${n}`, String(item.asin));
      params.set(`Quantity.${n}`, "1");
    });

    params.set("AssociateTag", ASSOCIATE_TAG);

    return `https://www.amazon.com/gp/aws/cart/add.html?${params.toString()}`;
  };

  const goToAmazonCart = async () => {
    const url = buildAmazonCartUrl();
    if (!url) {
      Alert.alert("Empty", "Your bag is empty");
      return;
    }

    // ✅ Optional “purchase intent” event (NOT a true purchase confirmation)
    try {
      await logPurchaseRecorded({
        source: "amazon",
        items: items.map((it) => ({
          id: it.asin,
          name: it.title,
          qty: 1,
          tags: Array.isArray(it.tags) ? it.tags : [],
        })),
      });
    } catch {
      // fail-open
    }

    Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: BagItem }) => (
    <View style={s.item}>
      {!!item.image && <Image source={{ uri: item.image }} style={s.itemImage} />}
      <View style={s.itemInfo}>
        <Text style={s.itemTitle} numberOfLines={2}>
          {item.title || "Saved Item"}
        </Text>
        <Text style={s.itemPrice}>{item.price || "Check price"}</Text>
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
            onPress={() => navigation.navigate("CompareProductsScreen")}
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
        keyExtractor={(i) => i.asin}
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

// ✅ Minimal styles (keep yours if you already have them)
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", backgroundColor: "#FFF" },
  title: { fontSize: 20, fontWeight: "900" },

  list: { padding: 16, paddingBottom: 120 },
  item: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  itemImage: { width: 60, height: 60, borderRadius: 12, marginRight: 12, backgroundColor: "#EEE" },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "800", color: "#111" },
  itemPrice: { marginTop: 6, fontSize: 12, color: "#6B7280" },
  remove: { fontSize: 24, fontWeight: "900", color: "#111", paddingHorizontal: 8 },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB", backgroundColor: "#FFF" },
  amazonBtn: { backgroundColor: "#111", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  amazonText: { color: "#FFF", fontWeight: "900" },
  disclaimer: { marginTop: 10, fontSize: 11, color: "#6B7280", textAlign: "center" },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: "900" },
  emptySub: { marginTop: 6, fontSize: 12, color: "#6B7280" },
  primaryBtn: { marginTop: 16, backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14 },
  primaryText: { color: "#FFF", fontWeight: "900" },
});
