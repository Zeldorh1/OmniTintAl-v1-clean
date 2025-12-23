// client/src/utils/ads/rewarded.ts
import mobileAds, { RewardedAd, RewardedAdEventType, TestIds } from "react-native-google-mobile-ads";

let initialized = false;

export async function initAds() {
  if (initialized) return;
  await mobileAds().initialize();
  initialized = true;
}

// Use TestIds.REWARDED during dev
export function showRewardedAd(adUnitId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rewarded = RewardedAd.createForAdRequest(adUnitId || TestIds.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsub = rewarded.onAdEvent((type, error, reward) => {
      if (error) {
        unsub();
        resolve(false);
        return;
      }
      if (type === RewardedAdEventType.EARNED_REWARD) {
        // user earned reward
        unsub();
        resolve(true);
      }
      if (type === RewardedAdEventType.CLOSED) {
        // closed without reward
        unsub();
        resolve(false);
      }
    });

    rewarded.load();
    rewarded.show().catch(() => {
      unsub();
      resolve(false);
    });
  });
}
