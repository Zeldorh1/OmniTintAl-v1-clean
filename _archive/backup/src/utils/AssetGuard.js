// client/src/utils/AssetGuard.js
// OmniTintAI ® — Asset Integrity Checker
// Ensures all images in @assets are valid and accessible at runtime.

import * as FileSystem from 'expo-file-system';
import { IMAGES } from '@assets';

export async function verifyAssets() {
  console.log('🧩 [AssetGuard] Running asset verification...');

  const missing = [];

  for (const [key, value] of Object.entries(IMAGES)) {
    try {
      // Expo packs assets with numeric IDs internally, so we resolve them manually
      const assetUri =
        typeof value === 'number'
          ? FileSystem.bundleDirectory + 'assets/' + key + '.png'
          : value.uri || value;

      const info = await FileSystem.getInfoAsync(assetUri);
      if (!info.exists) {
        missing.push(key);
      }
    } catch (e) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️ [AssetGuard] Missing assets detected:\n${missing
        .map((m) => ` - ${m}`)
        .join('\n')}`,
    );
  } else {
    console.log('✅ [AssetGuard] All assets verified successfully!');
  }
}
