// client/src/utils/deviceId.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const KEY = "@omnitintai:device_id_v1";

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;

  // Expo SDK 54 supports expo-crypto randomUUID
  const id = Crypto.randomUUID();
  await AsyncStorage.setItem(KEY, id);
  return id;
}
