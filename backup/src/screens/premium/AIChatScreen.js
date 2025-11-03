// client/src/screens/premium/AIChatScreen.js
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const BW = {
  bg: '#FFFFFF',
  ink: '#111111',
  sub: '#6B7280',
  line: '#E5E7EB',
  chipBg: '#F3F4F6',
  chipInk: '#111111',
  accent: '#111111',
  bubbleUser: '#111111',
  bubbleBot: '#F8FAFC',
};

const QUICK_CHIPS = [
  { id: 'c1', icon: 'star', label: 'Best blonde for olive skin?' },
  { id: 'c2', icon: 'water', label: 'Fix brassiness fast' },
  { id: 'c3', icon: 'spray-bottle', label: 'Heatless curl routine' },
  { id: 'c4', icon: 'palette', label: 'Go copper but low-maintenance' },
  { id: 'c5', icon: 'flower', label: 'Vegan bond repair picks' },
];

const INPUT_H = 42;   // input row height
const EXTRA_PAD = 90; // extra padding for comfort

export default function AIChatScreen() {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([
    {
      id: 'm0',
      role: 'bot',
      text:
        "Hi! I’m your Hair Expert ✨ Ask me about shades, damage fixes, or routine ideas. I can also pull Amazon options when you're ready.",
    },
  ]);

  const listRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [kbHeight, setKbHeight] = useState(0);

  // --- Keyboard handling so input bar moves up ---
  useEffect(() => {
    const onShow = (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(e?.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(0);
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const s = Keyboard.addListener(showEvent, onShow);
    const h = Keyboard.addListener(hideEvent, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const handleSend = (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;

    const userMsg = { id: `u_${Date.now()}`, role: 'user', text };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    fakeBotReply(text);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  };

  // TODO: replace with your real model call
  const fakeBotReply = () => {
    const reply =
      "Here’s a quick start: try a neutral-cool shade around level 7–8 and add a blue-violet gloss to cancel brass. Want me to compare a few Amazon options?";
    setTimeout(() => {
      setMsgs((m) => [...m, { id: `b_${Date.now()}`, role: 'bot', text: reply }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    }, 450);
  };

  const onChipPress = (label) => handleSend(label);

  // distance to lift input row; SafeArea bottom is already outside our SafeAreaView
  const bottomOffset = kbHeight;

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      {/* Title */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Hair Expert</Text>
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
            <MaterialCommunityIcons
              name={mapIcon(item.icon)}
              size={16}
              color={BW.chipInk}
              style={{ marginRight: 8 }}
            />
            <Text numberOfLines={1} style={styles.chipTxt}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chat */}
      <ScrollView
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          // keep last message visible above the keyboard & input row
          paddingBottom: EXTRA_PAD + INPUT_H + bottomOffset + insets.bottom,
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      >
        {msgs.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.role === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            {m.role === 'bot' && <Text style={styles.botName}>Omni Expert</Text>}
            <Text style={[styles.msgTxt, m.role === 'user' ? styles.msgTxtUser : styles.msgTxtBot]}>
              {m.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input bar (lifts with the keyboard) */}
      <View style={[styles.inputRow, { bottom: bottomOffset }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onChipPress('Hey OmniTint')}>
          <FontAwesome5 name="microphone" size={18} color={BW.ink} />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Ask anything…"
            placeholderTextColor={BW.sub}
            value={input}
            onChangeText={setInput}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
        </View>

        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function mapIcon(key) {
  switch (key) {
    case 'water': return 'water-percent';
    case 'spray-bottle': return 'spray-bottle';
    case 'palette': return 'palette';
    case 'flower': return 'flower';
    default: return 'star';
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BW.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: BW.ink, letterSpacing: -0.3 },
  badge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: BW.ink },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BW.chipBg, borderColor: BW.line, borderWidth: 1,
    paddingHorizontal: 12, height: 36, borderRadius: 18,
  },
  chipTxt: { color: BW.chipInk, fontSize: 13, fontWeight: '600', maxWidth: 260 },
  bubble: { maxWidth: '86%', borderRadius: 16, padding: 14, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: BW.bubbleUser },
  botBubble: { alignSelf: 'flex-start', backgroundColor: BW.bubbleBot, borderWidth: 1, borderColor: BW.line },
  botName: { fontSize: 12, color: BW.sub, marginBottom: 4, fontWeight: '700' },
  msgTxt: { fontSize: 15, lineHeight: 21 },
  msgTxtUser: { color: '#fff' },
  msgTxtBot: { color: BW.ink },
  inputRow: {
    position: 'absolute',
    left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#ffffffEE',
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: BW.line,
    // height not fixed; inner controls define height
  },
  iconBtn: {
    width: INPUT_H, height: INPUT_H, borderRadius: 12,
    borderWidth: 1, borderColor: BW.line,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, backgroundColor: '#fff',
  },
  inputWrap: {
    flex: 1, borderRadius: 14, borderWidth: 1, borderColor: BW.line,
    backgroundColor: '#fff', height: 44, paddingHorizontal: 14, justifyContent: 'center',
  },
  input: { fontSize: 15, color: BW.ink },
  sendBtn: {
    marginLeft: 10, height: INPUT_H, width: INPUT_H,
    borderRadius: 12, backgroundColor: BW.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
