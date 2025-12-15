// client/src/screens/premium/AIChatScreen.tsx
// FINAL DROP-IN (v2)
// ✅ No vector-icons
// ✅ Correct Grok stylist import path
// ✅ Premium gate check (routes to PremiumGate if locked)
// ✅ One-time Pro Tips overlay (versioned storage key)
// ✅ Light legal disclaimer (not medical/pro care)

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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// ✅ Premium SVG icon system (NO FONT FILES)
import { Icon } from "../../components/Icons";

// ✅ Gate util + Gate screen route
import { useSettings } from "../../context/SettingsContext";
import { checkLimit } from "../../utils/grokHairScannerBundles/userLimits";

// ✅ Feature guide overlay (shown once per update)
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";

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
        details ? "Based on your scan (goals + hair health)" : "Ask me anything about hair color and care"
      }.`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<ScrollView | null>(null);
  const [kbHeight, setKbHeight] = useState(0);

  // ─────────────────────────────────────────
  // Gate + guide (on mount)
  // ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Gate first
        const { allowed, limit } = await checkLimit(LIMIT_KEY, { isPremium });
        if (!allowed) {
          setUsesLeft(typeof limit === "number" ? limit : 0);
          setLocked(true);
          setLoading(false);
          // Route to your PremiumGate screen in PremiumNavigator
          navigation.navigate("PremiumGate", {
            feature: FEATURE_NAME,
            usesLeft: typeof limit === "number" ? limit : 0,
          });
          return;
        }

        setLocked(false);
        if (typeof limit === "number") setUsesLeft(limit);
        setLoading(false);

        // Then guide (one-time per update)
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
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

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

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
    const text = (textOverride ?? input).trim();
    if (!text || isTyping) return;

    const userMsg = { id: `u_${Date.now()}`, role: "user", text };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
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
          "Ask for a result + your current hair color (ex: “dark brown → ash blonde”).",
          "Mention texture + concerns (frizz, breakage, brassiness) for better plans.",
          "Use the quick chips for fast routines, then refine with follow-ups.",
          "If you have a scan result, Omni will tailor recommendations to it.",
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
            Personalized hair color + care guidance
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
          <TouchableOpacity key={item.id} style={styles.chip} onPress={() => onChipPress(item.label)}>
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
          paddingBottom: EXTRA_PAD + INPUT_H + bottomOffset + insets.bottom,
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

        {/* Light disclaimer */}
        <Text style={styles.disclaimer}>
          OmniTintAI provides informational guidance only — not medical advice, and not a substitute for professional care.
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
            placeholder="Ask Omni anything…"
            placeholderTextColor={BW.sub}
            value={input}
            onChangeText={setInput}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() || isTyping ? styles.sendBtnDisabled : null]}
          onPress={() => handleSend()}
          disabled={!input.trim() || isTyping}
        >
          <Icon name="chevronRight" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
  title: { fontSize: 24, fontWeight: "900", color: BW.ink, letterSpacing: -0.3 },
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
});
