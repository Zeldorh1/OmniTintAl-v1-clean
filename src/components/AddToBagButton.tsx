// client/src/components/AddToBagButton.tsx
// V1 · GLOBAL "ADD TO BAG" BUTTON
// - Uses the same @omnitintai:bag as CartScreen
// - Avoids duplicate ASINs
// - Shows "In Bag" after adding

import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BAG_KEY = "@omnitintai:bag";

export type AddToBagItem = {
  asin: string;
  title?: string;
  image?: string; // URL string (optional)
  price?: string;
  tags?: string[];
  brand?: string;
};

type Props = {
  item: AddToBagItem;
  variant?: "solid" | "outline";
  fullWidth?: boolean;
  onAdded?: () => void;
};

async function loadBag(): Promise<AddToBagItem[]> {
  try {
    const raw = await AsyncStorage.getItem(BAG_KEY);
    const bag = raw ? JSON.parse(raw) : [];
    return Array.isArray(bag) ? bag : [];
  } catch {
    return [];
  }
}

async function saveBag(items: AddToBagItem[]) {
  await AsyncStorage.setItem(BAG_KEY, JSON.stringify(items));
}

const AddToBagButton: React.FC<Props> = ({
  item,
  variant = "solid",
  fullWidth = false,
  onAdded,
}) => {
  const [busy, setBusy] = useState(false);
  const [inBag, setInBag] = useState(false);

  // Check once if this item is already in the bag
  useEffect(() => {
    (async () => {
      const bag = await loadBag();
      const exists = bag.some((b) => String(b.asin) === String(item.asin));
      setInBag(exists);
    })();
  }, [item.asin]);

  const handlePress = async () => {
    if (busy || inBag) return;

    if (!item.asin) {
      Alert.alert("Missing info", "This item is missing an Amazon ID (ASIN).");
      return;
    }

    try {
      setBusy(true);
      const bag = await loadBag();
      const exists = bag.some((b) => String(b.asin) === String(item.asin));

      if (!exists) {
        const next = [...bag, item];
        await saveBag(next);
      }

      setInBag(true);
      onAdded && onAdded();
    } catch (e) {
      Alert.alert(
        "Error",
        "Could not add this item to your bag. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const baseStyle = [
    styles.btn,
    fullWidth && { alignSelf: "stretch" },
    variant === "solid" ? styles.btnSolid : styles.btnOutline,
    inBag && styles.btnInBag,
  ];

  const textStyle = [
    styles.btnText,
    variant === "outline" && { color: "#111" },
    inBag && { color: "#111" },
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={baseStyle}
      onPress={handlePress}
      disabled={busy || inBag}
    >
      {busy ? (
        <ActivityIndicator color={variant === "solid" ? "#FFF" : "#111"} />
      ) : (
        <Text style={textStyle}>{inBag ? "In Bag" : "Add to Bag"}</Text>
      )}
    </TouchableOpacity>
  );
};

export default AddToBagButton;

const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  btnSolid: {
    backgroundColor: "#111",
  },
  btnOutline: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#111",
  },
  btnInBag: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  btnText: {
    fontWeight: "800",
    fontSize: 14,
    color: "#FFF",
  },
});
