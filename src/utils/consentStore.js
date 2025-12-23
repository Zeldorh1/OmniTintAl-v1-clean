// client/src/utils/consentStore.ts
// V1 — Required-choice consent for anonymized stats (no photos, no PII)
// - Default: NOT answered yet, sharing OFF until user chooses
// - Once answered, user can toggle anytime in Settings

import AsyncStorage from "@react-native-async-storage/async-storage";

export const CONSENT_KEY = "@omnitintai:consent_v1";

export type ConsentState = {
  v: 1;
  shareAnonymizedStats: boolean;
  hasAnsweredConsentPrompt: boolean;
  updatedAt: number;
};

const DEFAULT_CONSENT: ConsentState = {
  v: 1,
  shareAnonymizedStats: false,
  hasAnsweredConsentPrompt: false,
  updatedAt: Date.now(),
};

export async function getConsent(): Promise<ConsentState> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return DEFAULT_CONSENT;

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONSENT,
      ...parsed,
      v: 1,
      shareAnonymizedStats: !!parsed?.shareAnonymizedStats,
      hasAnsweredConsentPrompt: !!parsed?.hasAnsweredConsentPrompt,
      updatedAt: typeof parsed?.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return DEFAULT_CONSENT;
  }
}

export async function setConsent(patch: Partial<ConsentState>): Promise<ConsentState> {
  const current = await getConsent();
  const next: ConsentState = {
    ...current,
    ...patch,
    v: 1,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  return next;
}

export async function resetConsent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CONSENT_KEY);
  } catch {}
}
