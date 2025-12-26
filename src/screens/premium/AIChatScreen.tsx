// client/src/screens/premium/AIChatScreen.tsx
// FINAL · V1 · AI STYLIST CHAT · COSMETIC-ONLY + 18+ CONSENT
//
// - Premium-gated AI stylist chat using Grok Stylist worker
// - Intended ONLY for hair color + cosmetic hair-care guidance
// - First-use 18+ / fair-use / non-medical consent gate (2 separate confirms)
// - Light always-on disclaimer in the chat
// - All non-hair / non-cosmetic domain enforcement should be handled server-side
//   in the grok-stylist worker prompt + guard.

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Premium SVG icon system (NO FONT FILES)
import { Icon } from "../../components/Icons";

// ✅ Gate util + Gate screen route
import { useSettings } from "../../context/SettingsContext";
import { checkLimit } from "../../utils/grokHairScannerBundles/userLimits";

// ✅ Feature guide overlay (shown once per update)
import FeatureGuideOverlay, {
  hasSeenGuide,
} from "../../components/FeatureGuideOverlay";

// ✅ Correct (authoritative) import path
import { askGrokStylist } from "../../utils/grokHairScannerBundles/grokStylist";

const BW = {
  bg: "#FFFFFF",
  ink: "#111111",
  sub: "#6B7280",
  line: "#E5E7EB",
  chipBg: "#F3F4F6",
  chipInk: "#111111",
  accent: "#111111",
  bubbleUser: "#111111",
  bubbleBot: "#F8FAFC",
};

const QUICK_CHIPS = [
  { id: "c1", icon: "sparkles", label: "Best blonde for olive skin?" },
  { id: "c2", icon: "sparkles", label: "Fix brassiness fast" },
  { id: "c3", icon: "sparkles", label: "Heatless curl routine" },
  { id: "c4", icon: "sparkles", label: "Go copper but low-maintenance" },
  { id: "c5", icon: "sparkles", label: "Vegan bond repair picks" },
];

const INPUT_H = 42;
const EXTRA_PAD = 92;

// 🔒 Version this whenever you want it to show again after an update
const GUIDE_KEY = "@omnitintai:guide_aichat_v2";
const FEATURE_NAME = "AI Stylist Chat";
const LIMIT_KEY = "AI_CHAT";

// 🔒 Consent gate storage key (bump version if text changes in future)
const CONSENT_KEY = "@omnitintai:aichat_consent_v1";

export default function AIChatScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const isPremium = !!settings?.account?.isPremium;

  const { details } = (route && route.params) || {};

  const [locked, setLocked] = useState(false);
  const [usesLeft, setUsesLeft] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  const [showGuide, setShowGuide] = useState(false);

  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<any[]>([
    {
      id: "m0",
      role: "bot",
      text: `Hi! I’m Omni, your AI stylist. ${
        details
          ? "I can help you plan hair color and care based on your current goals and hair behaviour."
          : "Ask me anything about hair color and cosmetic hair care (not medical concerns)."
      }`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<ScrollView | null>(null);
  const [kbHeight, setKbHeight] = useState(0);

  // 🔒 Consent gate state
  const [showConsent, setShowConsent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosConfirmed, setTosConfirmed] = useState(false);
  const consentReady = ageConfirmed && tosConfirmed;

  // ─────────────────────────────────────────
  // Gate + guide + consent (on mount)
  // ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // 1) Premium / usage limit gate
        const { allowed, limit } = await checkLimit(LIMIT_KEY, { isPremium });
        if (!allowed) {
          setUsesLeft(typeof limit === "number" ? limit : 0);
          setLocked(true);
          setLoading(false);
          navigation.navigate("PremiumGate", {
            feature: FEATURE_NAME,
            usesLeft: typeof limit === "number" ? limit : 0,
          });
          return;
        }

        setLocked(false);
        if (typeof limit === "number") setUsesLeft(limit);

        // 2) One-time pro tips overlay
        const seenGuide = await hasSeenGuide(GUIDE_KEY);
        if (!seenGuide) setShowGuide(true);

        // 3) 18+ / fair-use / non-medical consent gate (only for allowed users)
        const consent = await AsyncStorage.getItem(CONSENT_KEY);
        if (!consent) {
          setShowConsent(true);
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  // ─────────────────────────────────────────
  // Keyboard lift
  // ─────────────────────────────────────────
  useEffect(() => {
    const onShow = (e: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(e?.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(0);
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const s = Keyboard.addListener(showEvent, onShow);
    const h = Keyboard.addListener(hideEvent, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      if (listRef.current && (listRef.current as any).scrollToEnd) {
        (listRef.current as any).scrollToEnd({ animated: true });
      }
    });
  };

  useEffect(() => {
    scrollToEnd();
  }, [msgs.length]);

  const handleSend = async (textOverride?: string) => {
    // Don’t allow sending until consent is accepted
    if (showConsent) return;

    const text = (textOverride ?? input).trim();
    if (!text || isTyping) return;

    const userMsg = { id: `u_${Date.now()}`, role: "user", text };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // IMPORTANT:
      // Any domain restriction (“only hair/cosmetics”, “no explicit content”,
      // “no medical advice”) MUST also be enforced in the grok-stylist worker
      // prompt + guard. This UI assumes that worker is already locked to
      // hair/cosmetic topics only.
      const answer = await askGrokStylist(
        text,
        details || {},
        [], // filters (reserved)
        "standard"
      );

      setMsgs((m) => [
        ...m,
        {
          id: `b_${Date.now()}`,
          role: "bot",
          text: typeof answer === "string" ? answer : String(answer),
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          id: `b_${Date.now()}`,
          role: "bot",
          text: "I’m having trouble responding right now. Try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const onChipPress = (label: string) => handleSend(label);
  const bottomOffset = kbHeight;

  const handleCompleteConsent = async () => {
    if (!consentReady) return;
    try {
      await AsyncStorage.setItem(CONSENT_KEY, "1");
    } catch {
      // fail-open; but gate has already been clicked by the user
    }
    setShowConsent(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.wrap, styles.center]}>
        <ActivityIndicator size="large" color={BW.ink} />
        <Text style={styles.loadingTxt}>Starting Omni Stylist…</Text>
      </SafeAreaView>
    );
  }

  // If locked, we already navigated to PremiumGate.
  // Returning null prevents flash.
  if (locked) return null;

  return (
    <SafeAreaView style={styles.wrap} edges={["top", "left", "right"]}>
      {/* One-time Pro Tips (per update) */}
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        title="Pro tips for Omni Stylist"
        bullets={[
          "Ask about hair color and cosmetic hair care only (not medical issues).",
          "Include your current color, texture, and main concerns (like frizz or brassiness).",
          "Use the quick chips for fast routines, then refine with follow-ups.",
          "Always double-check routines and product choices with a stylist or professional if you’re unsure.",
        ]}
        visible={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconBtnHeader}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevronLeft" size={20} color={BW.ink} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Omni Stylist</Text>
          <Text style={styles.subTitle}>
            18+ cosmetic hair color & care guidance — not medical advice.
          </Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>AI</Text>
        </View>
      </View>

      {/* Quick chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        style={{ maxHeight: 46 }}
      >
        {QUICK_CHIPS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.chip}
            onPress={() => onChipPress(item.label)}
          >
            <View style={{ marginRight: 8 }}>
              <Icon name={item.icon as any} size={16} color={BW.chipInk} />
            </View>
            <Text numberOfLines={1} style={styles.chipTxt}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chat scroll */}
      <ScrollView
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom:
            EXTRA_PAD + INPUT_H + bottomOffset + insets.bottom,
        }}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
      >
        {msgs.map((m: any) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.role === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            {m.role === "bot" && <Text style={styles.botName}>Omni</Text>}
            <Text
              style={[
                styles.msgTxt,
                m.role === "user" ? styles.msgTxtUser : styles.msgTxtBot,
              ]}
            >
              {m.text}
            </Text>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.bubble, styles.botBubble]}>
            <Text style={styles.botName}>Omni</Text>
            <Text style={[styles.msgTxt, styles.msgTxtBot]}>Thinking…</Text>
          </View>
        )}

        {/* Always-visible light disclaimer */}
        <Text style={styles.disclaimer}>
          Omni Stylist is for general hair color and cosmetic hair-care
          guidance only. It does not provide medical advice, mental health
          support, or professional services. Always double-check any routine,
          treatment, or product changes with a licensed stylist, dermatologist,
          or other qualified professional before acting.
        </Text>
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputRow, { bottom: bottomOffset }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            // Voice hook placeholder (wire later)
          }}
        >
          <Icon name="mic" size={18} color={BW.ink} />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Ask about hair color and cosmetic hair care…"
            placeholderTextColor={BW.sub}
            value={input}
            onChangeText={setInput}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            !input.trim() || isTyping || showConsent
              ? styles.sendBtnDisabled
              : null,
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim() || isTyping || showConsent}
        >
          <Icon name="chevronRight" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 🔒 18+ / Fair-use / Non-medical Consent Overlay */}
      {showConsent && (
        <View style={styles.consentOverlay}>
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>Before you use Omni Stylist</Text>
            <Text style={styles.consentBody}>
              Omni Stylist is an AI for hair color and cosmetic hair-care
              guidance only. It is not a doctor, therapist, or licensed
              professional and must not be used for medical, emergency, or life
              decisions.
            </Text>

            <Text style={styles.consentBody}>
              By continuing, you agree to:
            </Text>

            <TouchableOpacity
              style={[
                styles.consentBtn,
                ageConfirmed && styles.consentBtnActive,
              ]}
              onPress={() => setAgeConfirmed(true)}
            >
              <Text style={styles.consentBtnText}>
                ✅ I confirm I am 18 years or older.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.consentBtn,
                tosConfirmed && styles.consentBtnActive,
              ]}
              onPress={() => setTosConfirmed(true)}
            >
              <Text style={styles.consentBtnText}>
                ✅ I agree to fair use and understand this is not medical advice.
              </Text>
            </TouchableOpacity>

            <Text style={styles.consentFinePrint}>
              Fair use means: no harassment, hate, explicit content, or using
              responses for harmful, illegal, or non-hair-related purposes.
              Always check any routine or product changes with a trained
              professional before you try them.
            </Text>

            <TouchableOpacity
              style={[
                styles.consentContinueBtn,
                !consentReady && styles.consentContinueDisabled,
              ]}
              onPress={handleCompleteConsent}
              disabled={!consentReady}
            >
              <Text style={styles.consentContinueText}>
                Enter Omni Stylist
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BW.bg },
  center: { justifyContent: "center", alignItems: "center", padding: 24 },
  loadingTxt: { marginTop: 12, color: BW.sub, fontWeight: "700" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 10,
  },
  iconBtnHeader: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BW.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: BW.ink,
    letterSpacing: -0.3,
  },
  subTitle: { marginTop: 2, fontSize: 12, color: BW.sub, fontWeight: "600" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: BW.ink,
  },
  badgeTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BW.chipBg,
    borderColor: BW.line,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
  },
  chipTxt: { color: BW.chipInk, fontSize: 13, fontWeight: "700", maxWidth: 260 },

  bubble: { maxWidth: "86%", borderRadius: 16, padding: 14, marginBottom: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: BW.bubbleUser },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: BW.bubbleBot,
    borderWidth: 1,
    borderColor: BW.line,
  },
  botName: { fontSize: 12, color: BW.sub, marginBottom: 4, fontWeight: "800" },
  msgTxt: { fontSize: 15, lineHeight: 21 },
  msgTxtUser: { color: "#fff", fontWeight: "600" },
  msgTxtBot: { color: BW.ink, fontWeight: "600" },

  disclaimer: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 11,
    color: BW.sub,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 10,
  },

  inputRow: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffffEE",
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BW.line,
  },
  iconBtn: {
    width: INPUT_H,
    height: INPUT_H,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BW.line,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  inputWrap: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BW.line,
    backgroundColor: "#fff",
    height: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  input: { fontSize: 15, color: BW.ink, fontWeight: "600" },
  sendBtn: {
    marginLeft: 10,
    height: INPUT_H,
    width: INPUT_H,
    borderRadius: 12,
    backgroundColor: BW.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },

  // 🔒 Consent overlay styles
  consentOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  consentCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BW.line,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: BW.ink,
    marginBottom: 8,
  },
  consentBody: {
    fontSize: 13,
    color: BW.sub,
    marginBottom: 8,
  },
  consentBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BW.line,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    backgroundColor: "#FFF",
  },
  consentBtnActive: {
    borderColor: BW.ink,
    backgroundColor: "#F3F4F6",
  },
  consentBtnText: {
    fontSize: 13,
    color: BW.ink,
    fontWeight: "700",
  },
  consentFinePrint: {
    fontSize: 11,
    color: BW.sub,
    marginTop: 10,
    lineHeight: 16,
  },
  consentContinueBtn: {
    marginTop: 14,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: BW.ink,
  },
  consentContinueDisabled: {
    opacity: 0.4,
  },
  consentContinueText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
