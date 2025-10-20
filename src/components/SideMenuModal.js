import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function SideMenuModal({ visible, onClose }) {
  const navigation = useNavigation();

  const items = [
    { label: 'Hair Health Scanner', route: 'HairHealthScanner' },
    { label: 'AR 360 Preview', route: 'AR360Preview' },
    { label: 'AI Chatbox', route: 'AIChat' },
    { label: 'Settings', route: 'Settings' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent  // 👈 prevents a flat bar at the very top on Android
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      {/* Right-side floating sheet with rounded corners */}
      <Animated.View style={styles.sheet}>
        <Text style={styles.title}>OmniTintAI Studio</Text>

        {items.map((it, i) => (
          <Pressable
            key={i}
            onPress={() => {
              onClose();
              navigation.navigate(it.route);
            }}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.itemText}>{it.label}</Text>
          </Pressable>
        ))}

        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>Close ✕</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.72,
    backgroundColor: '#fff',     // 🔒 keep your current color
    paddingTop: 60,
    paddingHorizontal: 20,
    // “floating card” look
    marginTop: 12,                // 👈 pulls the sheet slightly down for a clean rounded top
    marginBottom: 12,
    borderTopLeftRadius: 24,      // 👈 rounded edges (top & bottom left)
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 22,
  },
  item: {
    paddingVertical: 14,
    borderBottomColor: '#eee',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 15, color: '#111', fontWeight: '500' },
  close: {
    marginTop: 28,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#111',      // 🔒 unchanged
  },
  closeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
