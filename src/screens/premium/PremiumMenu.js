import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

const UI = {
  radius: 14,
  padV: 12,         // compact vertical padding
  padH: 14,
  gap: 10,
  iconBox: 28,      // smaller icon badge
  iconSize: 14,
  labelSize: 16,
  shadow: 0.05,     // softer shadow
};

function Row({ icon, label, to }) {
  const nav = useNavigation();
  return (
    <Pressable
      onPress={() => nav.navigate(to)}
      android_ripple={{ color: '#ececec' }}
      style={({ pressed }) => [
        s.row,
        pressed && Platform.OS === 'ios' && { opacity: 0.9, transform: [{ scale: 0.995 }] },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={s.iconWrap}>
          <FontAwesome5 name={icon} size={UI.iconSize} color="#111" />
        </View>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <FontAwesome5 name="chevron-right" size={13} color="#9AA0A6" />
    </Pressable>
  );
}

export default function PremiumMenu() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.h1}>✨ PREMIUM MENU ✨</Text>

        <Row icon="question"       label="AR Try-On"              to="ARStudio" />
        <Row icon="cube"           label="360° Try-On"            to="AR360PreviewScreen" />
        <Row icon="cut"            label="Hair Health Scanner"    to="HairHealthScannerScreen" />
        <Row icon="flask"          label="Custom Hair Mixer Pro"  to="HairMixerScreen" />
        <Row icon="magic"          label="AI Suggested Styles"    to="AIStylesScreen" />
        <Row icon="balance-scale"  label="Compare Products"       to="CompareProductsScreen" />
        <Row icon="chart-line"     label="Trend Radar"            to="TrendRadarScreen" />
        <Row icon="comments"       label="AI Chat"                to="AIChatScreen" />
        <Row icon="chart-bar"      label="Progress Tracker"       to="ProgressTrackerScreen" />
        <Row icon="cog"            label="Settings"               to="SettingsScreen" />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  // Center everything and keep a comfortable max width for that “balanced” feel
  container: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },

  h1: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
    letterSpacing: 0.2,
  },

  row: {
    width: '100%',
    maxWidth: 680, // keeps it centered and not edge-to-edge on larger devices
    backgroundColor: '#fff',
    borderRadius: UI.radius,
    paddingVertical: UI.padV,
    paddingHorizontal: UI.padH,
    marginTop: 12,

    // subtle card
    shadowColor: '#000',
    shadowOpacity: UI.shadow,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDF1F5',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconWrap: {
    width: UI.iconBox,
    height: UI.iconBox,
    borderRadius: 8,
    backgroundColor: '#F3F6FA',
    borderWidth: 1,
    borderColor: '#E6ECF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UI.gap,
  },

  rowLabel: {
    fontSize: UI.labelSize,
    fontWeight: '800',
    color: '#111',
  },
});
