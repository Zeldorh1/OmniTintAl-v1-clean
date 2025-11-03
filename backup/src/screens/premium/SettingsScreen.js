// src/screens/premium/SettingsScreen.js
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Application from 'expo-application';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { useSettings } from '../../context/SettingsContext';
import { SUPPORT_EMAIL } from '../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to open OS settings
const openOSSettings = async () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: 'package:' + Application.applicationId }
    );
  }
};

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 380;

  const { settings, update, resetAll } = useSettings();
  const [reportText, setReportText] = useState('');

  // --- Account actions (placeholder until real auth is hooked) ---
  const signIn = () => {
    const uid = 'omni_' + Math.random().toString(36).slice(2, 8);
    update({ account: { signedIn: true, userId: uid, email: null } });
    Alert.alert('Signed in', 'Local account created.');
  };

  const signOut = () => {
    update({ account: { signedIn: false, userId: null, email: null } });
    Alert.alert('Signed out', 'This device is signed out.');
  };

  const deleteAccount = async () => {
    Alert.alert(
      'Delete account',
      'This will delete your personal data stored on this device (favorites, measurements, settings). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([
              AsyncStorage.removeItem('omni_settings_v1'),
              AsyncStorage.removeItem('omni_progress_entries_v1'),
              AsyncStorage.removeItem('omni_favs_v1'),
            ]);
            await resetAll();
            Alert.alert('Deleted', 'Local account & data removed from this device.');
          },
        },
      ]
    );
  };

  // --- Security (biometrics) ---
  const toggleBiometric = async (next) => {
    if (next) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (!hasHardware || !types?.length) {
        Alert.alert('Not available', 'This device does not support biometrics.');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('No biometrics enrolled', 'Please enroll in your phone settings first.');
        return;
      }
    }
    update({ biometricLock: next });
  };

  // --- Notifications ---
  const toggleNotifications = async (next) => {
    if (next) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable notifications in system settings.');
        return;
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    update({ notificationsEnabled: next });
  };

  // --- Report a problem ---
  const sendReport = async () => {
    const body = reportText.trim() || '(empty)';
    try {
      const can = await MailComposer.isAvailableAsync();
      if (can) {
        await MailComposer.composeAsync({
          recipients: [SUPPORT_EMAIL],
          subject: 'OmniTintAI – Problem report',
          body,
        });
      } else {
        Linking.openURL(
          `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
            'OmniTintAI – Problem report'
          )}&body=${encodeURIComponent(body)}`
        );
      }
      setReportText('');
    } catch {
      Alert.alert('Error', 'Could not open mail client.');
    }
  };

  const themeOptions = useMemo(
    () => [
      { key: 'light', label: 'Light' },
      { key: 'dark', label: 'Dark' },
    ],
    []
  );

  const langOptions = [
    { key: 'auto', label: 'Auto (device)' },
    { key: 'en', label: 'English' },
    { key: 'es', label: 'Español' },
    { key: 'fr', label: 'Français' },
    { key: 'de', label: 'Deutsch' },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: settings.backgroundColor || '#fff' }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={s.h1}>Settings</Text>

        {/* ACCOUNT */}
        <Section title="Account">
          <Row
            left={
              <Label
                title={settings.account.signedIn ? 'Signed in' : 'Not signed in'}
                subtitle={settings.account.userId || 'Create a local account'}
              />
            }
            right={
              settings.account.signedIn ? (
                <View style={{ flexDirection: 'row' }}>
                  <MiniBtn text="Sign out" onPress={signOut} />
                  <MiniBtn text="Delete" danger onPress={deleteAccount} />
                </View>
              ) : (
                <MiniBtn text="Sign in" onPress={signIn} />
              )
            }
          />
        </Section>

        {/* PRIVACY */}
        <Section title="Privacy">
          <ToggleRow
            title="Voice wake (“Hey Omni/OmniTint”)"
            value={settings.voiceWakeEnabled}
            onValueChange={(v) => update({ voiceWakeEnabled: v })}
          />
          <ToggleRow
            title="Tap-to-mic enabled"
            value={settings.microphoneEnabled}
            onValueChange={(v) => update({ microphoneEnabled: v })}
          />
          <ToggleRow
            title="Share anonymized usage stats"
            subtitle="Off by default. We never upload photos or EXIF."
            value={settings.shareAnonymizedStats}
            onValueChange={(v) => update({ shareAnonymizedStats: v })}
          />
          <Row
            left={<Label title="System permissions" subtitle="Camera, Notifications, etc." />}
            right={<MiniBtn text="Open settings" onPress={openOSSettings} />}
          />
        </Section>

        {/* SECURITY & PERMISSIONS */}
        <Section title="Security & permissions">
          <ToggleRow
            title="Biometric lock"
            subtitle="Require Face/Touch ID when opening the app."
            value={settings.biometricLock}
            onValueChange={toggleBiometric}
          />
        </Section>

        {/* NOTIFICATIONS */}
        <Section title="Notifications">
          <ToggleRow
            title="Enable notifications"
            value={settings.notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </Section>

        {/* DISPLAY */}
        <Section title="Display">
          <Row
            left={<Label title="Theme" subtitle="Light or Dark" />}
            right={
              <Segment
                options={themeOptions}
                value={settings.theme}
                onChange={(v) => update({ theme: v })}
              />
            }
          />

          <View style={{ height: 12 }} />

          <Text style={s.label}>Background color (app-wide)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            {['#FFFFFF', '#F6F6F6', '#EFEFEF', '#FFFAF2', '#F2FAFF', '#F9F1FF'].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => update({ backgroundColor: c })}
                style={[
                  s.swatch,
                  {
                    backgroundColor: c,
                    borderColor: c === settings.backgroundColor ? '#111' : '#E3E3E3',
                    borderWidth: c === settings.backgroundColor ? 2 : 1,
                  },
                ]}
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <View style={[s.colorPreview, { backgroundColor: settings.backgroundColor }]} />
            <TextInput
              value={settings.backgroundColor}
              onChangeText={(t) => update({ backgroundColor: t })}
              style={s.colorInput}
              placeholder="#FFFFFF"
              autoCapitalize="none"
            />
          </View>
        </Section>
<ToggleRow
  title="Show intro video on launch"
  value={settings.showIntroOnLaunch}
  onValueChange={(v) => update({ showIntroOnLaunch: v })}
/>
        {/* LANGUAGE */}
        <Section title="Language">
          {isSmall ? (
            // Stack on small screens so the label doesn't get squeezed
            <>
              <Label
                title="App language"
                subtitle="Auto uses your phone’s language"
              />
              <View style={{ height: 8 }} />
              <Segment
                options={langOptions}
                value={settings.language}
                onChange={(v) => update({ language: v })}
                fullWidth
              />
            </>
          ) : (
            <Row
              left={
                <Label
                  title="App language"
                  subtitle="Auto uses your phone’s language"
                />
              }
              right={
                <Segment
                  options={langOptions}
                  value={settings.language}
                  onChange={(v) => update({ language: v })}
                  fullWidth
                />
              }
            />
          )}
        </Section>

        {/* REPORT A PROBLEM */}
        <Section title="Report a problem">
          <TextInput
            value={reportText}
            onChangeText={setReportText}
            placeholder="Tell us what happened…"
            style={s.textarea}
            multiline
          />
          <PrimaryBtn text="Send report via email" icon="paper-plane" onPress={sendReport} />
        </Section>

        {/* LOG OUT */}
        <Section title=" " noPadTop>
          <DangerBtn text="Log out" onPress={signOut} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- small UI atoms ---------- */
function Section({ title, children, noPadTop }) {
  return (
    <View style={[s.card, !noPadTop && { marginTop: 16 }]}>
      {!!title && <Text style={s.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

function Row({ left, right }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>{left}</View>
      {!!right && <View style={{ marginLeft: 10 }}>{right}</View>}
    </View>
  );
}

function ToggleRow({ title, subtitle, value, onValueChange }) {
  return (
    <Row
      left={<Label title={title} subtitle={subtitle} />}
      right={<Switch value={value} onValueChange={onValueChange} />}
    />
  );
}

function Label({ title, subtitle }) {
  return (
    <View>
      <Text style={s.rowTitle}>{title}</Text>
      {!!subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
    </View>
  );
}

function Segment({ options, value, onChange, wide, fullWidth }) {
  return (
    <View
      style={[
        s.segment,
        (wide || fullWidth) && s.segmentWide,
        fullWidth && { width: '100%' },
      ]}
    >
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[
            s.segBtn,
            value === o.key && s.segBtnActive,
            fullWidth && s.segBtnFluid,
          ]}
        >
          <Text style={[s.segText, value === o.key && s.segTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MiniBtn({ text, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.miniBtn, danger && { borderColor: '#E53935' }]}
    >
      <Text style={[s.miniBtnText, danger && { color: '#E53935' }]}>{text}</Text>
    </TouchableOpacity>
  );
}

function PrimaryBtn({ text, onPress, icon }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.primaryBtn}>
      {icon && (
        <FontAwesome5 name={icon} size={14} color="#fff" style={{ marginRight: 8 }} />
      )}
      <Text style={s.primaryText}>{text}</Text>
    </TouchableOpacity>
  );
}

function DangerBtn({ text, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.dangerBtn}>
      <Text style={s.dangerText}>{text}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,              // ✅ add bottom spacing so cards never overlap
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: { fontWeight: '800', color: '#111', fontSize: 15, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowTitle: { fontWeight: '700', color: '#111' },
  rowSub: { color: '#777', marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    padding: 4,
  },
  segmentWide: { flexWrap: 'wrap', justifyContent: 'space-between' },
  segBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  segBtnActive: { backgroundColor: '#111' },
  segBtnFluid: {
    flexGrow: 1,
    minWidth: '46%',     // ✅ two buttons per row on small widths
    alignItems: 'center',
    marginVertical: 4,
  },
  segText: { color: '#111', fontWeight: '700' },
  segTextActive: { color: '#fff' },
  miniBtn: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
  },
  miniBtnText: { fontWeight: '700', color: '#111' },
  primaryBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  dangerBtn: {
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerText: { color: '#E53935', fontWeight: '800' },
  swatch: { width: 28, height: 28, borderRadius: 6, marginRight: 10 },
  colorPreview: {
    width: 36,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    marginRight: 8,
  },
  colorInput: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    minWidth: 120,
    fontWeight: '700',
    color: '#111',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    minHeight: 110,
    padding: 12,
    textAlignVertical: 'top',
  },
});
