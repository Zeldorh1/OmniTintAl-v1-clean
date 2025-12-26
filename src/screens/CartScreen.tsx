// client/src/screens/premium/CartScreen.tsx
// FINAL · V1 LAUNCH BUILD
// OmniTintAI Bag → Multi-ASIN Amazon Checkout
// Includes: Item count header · Amazon App deep link fallback · Affiliate safe

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
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ASSOCIATE_TAG } from "../../config/affiliate";

import { logBagAdded, logPurchaseRecorded } from "../../brain/events";

const BAG_KEY = "@omnitintai:bag";
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

  const loadBag = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BAG_KEY);
      const bag: BagItem[] = raw ? JSON.parse(raw) : [];
      const safeBag = Array.isArray(bag) ? bag : [];
      setItems(safeBag);

      const loggedRaw = await AsyncStorage.getItem(BAG_LOGGED_KEY);
      const logged: Record<string, boolean> = loggedRaw ? JSON.parse(loggedRaw) : {};
      let changed = false;

      for (const it of safeBag) {
        const asin = String(it.asin || "").trim();
        if (!asin) continue;

        if (!logged[asin]) {
          logged[asin] = true;
          changed = true;
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

  useEffect(() => loadBag(), [loadBag]);

  const removeItem = async (asin: string) => {
    const updated = items.filter((i) => i.asin !== asin);
    await AsyncStorage.setItem(BAG_KEY, JSON.stringify(updated));
    setItems(updated);
  };

  const buildAmazonCartUrl = () => {
    if (!items.length) return null;
    const params = new URLSearchParams();
    items.forEach((item, i) => {
      const n = i + 1;
      params.set(`ASIN.${n}`, item.asin);
      params.set(`Quantity.${n}`, "1");
    });
    params.set("AssociateTag", ASSOCIATE_TAG);
    return `https://www.amazon.com/gp/aws/cart/add.html?${params.toString()}`;
  };

  const goToAmazonCheckout = async () => {
    const url = buildAmazonCartUrl();
    if (!url) return Alert.alert("Empty", "Your bag is empty.");

    // Preferred -> App deep link / fallback to browser
    const appUrl = url.replace("https://www.amazon.com", "amazon://www.amazon.com");

    await logPurchaseRecorded({
      source: "amazon",
      items: items.map((it) => ({ id: it.asin, name: it.title, qty: 1 })),
    });

    Linking.openURL(appUrl).catch(() => Linking.openURL(url));
  };

  const renderItem = ({ item }: { item: BagItem }) => (
    <View style={s.item}>
      {!!item.image && <Image source={{ uri: item.image }} style={s.itemImage} />}
      <View style={s.itemInfo}>
        <Text style={s.itemTitle} numberOfLines={2}>{item.title || "Saved Item"}</Text>
        <Text style={s.itemPrice}>{item.price || "Check price on Amazon"}</Text>
      </View>

      <TouchableOpacity onPress={() => removeItem(item.asin)}>
        <Text style={s.remove}>×</Text>
      </TouchableOpacity>
    </View>
  );

  // Empty State --------------------------------------------------
  if (items.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>Your Bag</Text>
        </View>

        <View style={s.empty}>
          <Text style={s.emptyIcon}>🛍️</Text>
          <Text style={s.emptyTitle}>Your bag is empty</Text>
          <Text style={s.emptySub}>Save products you love & check out when ready.</Text>

          <TouchableOpacity onPress={() => navigation.navigate("CompareProductsScreen")} style={s.primaryBtn}>
            <Text style={s.primaryText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main ----------------------------------------------------------
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>
          Your Bag ({items.length} {items.length === 1 ? "item" : "items"})
        </Text>
      </View>

      <FlatList data={items} keyExtractor={(i) => i.asin} renderItem={renderItem} contentContainerStyle={s.list} />

      <View style={s.footer}>
        <TouchableOpacity style={s.amazonBtn} onPress={goToAmazonCheckout}>
          <Text style={s.amazonText}>Checkout on Amazon</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          Items in your OmniTintAI bag will be purchased securely through Amazon.
          Final pricing, shipping & fulfillment handled by Amazon.
        </Text>
        <Text style={s.disclaimer}>
          As an Amazon Associate, OmniTintAI earns from qualifying purchases.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Styles unchanged except layout polish
const s = StyleSheet.create({
  safe:{ flex:1,backgroundColor:"#FAFAFA"},
  header:{padding:16,borderBottomWidth:1,borderBottomColor:"#E5E7EB",backgroundColor:"#FFF"},
  title:{fontSize:20,fontWeight:"900",color:"#111"},
  list:{padding:16,paddingBottom:120},

  item:{flexDirection:"row",backgroundColor:"#FFF",borderRadius:16,padding:12,marginBottom:12,borderWidth:1,borderColor:"#E5E7EB",alignItems:"center"},
  itemImage:{width:60,height:60,borderRadius:12,marginRight:12,backgroundColor:"#EEE"},
  itemInfo:{flex:1},
  itemTitle:{fontSize:14,fontWeight:"800",color:"#111"},
  itemPrice:{marginTop:6,fontSize:12,color:"#6B7280"},
  remove:{fontSize:24,fontWeight:"900",color:"#111",paddingHorizontal:8},

  footer:{padding:16,borderTopWidth:1,borderTopColor:"#E5E7EB",backgroundColor:"#FFF"},
  amazonBtn:{backgroundColor:"#111",paddingVertical:14,borderRadius:14,alignItems:"center"},
  amazonText:{color:"#FFF",fontWeight:"900",fontSize:14},
  disclaimer:{marginTop:8,fontSize:11,color:"#6B7280",textAlign:"center"},

  empty:{flex:1,justifyContent:"center",alignItems:"center",padding:24},
  emptyIcon:{fontSize:40},
  emptyTitle:{marginTop:12,fontSize:16,fontWeight:"900",color:"#111"},
  emptySub:{marginTop:6,fontSize:12,color:"#6B7280",textAlign:"center"},
  primaryBtn:{marginTop:16,backgroundColor:"#111",paddingVertical:12,paddingHorizontal:18,borderRadius:14},
  primaryText:{color:"#FFF",fontWeight:"900"},
});
