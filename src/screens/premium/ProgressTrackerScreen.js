// src/screens/premium/ProgressTrackerScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { FontAwesome5 } from '@expo/vector-icons';

import LengthRuler from '../../components/LengthRuler';
import {
  addEntry,
  loadEntries,
  removeEntry,
  growthPerMonth,
  recommendRecolorWeeks,
  toCm,
  toInches,
} from '../../utils/progressStorage';

const AVG_US_IN_PER_MONTH = 0.5; // reference line

export default function ProgressTrackerScreen() {
  const [entries, setEntries] = useState([]);
  const [mode, setMode] = useState('manual'); // 'manual' | 'photo'
  const [unit, setUnit] = useState('in'); // 'in' | 'cm'
  const [manualLen, setManualLen] = useState(12);
  const [overlayLen, setOverlayLen] = useState(12); // used in photo overlay
  const [photoUri, setPhotoUri] = useState(null);
  const [reminders, setReminders] = useState(false);

  useEffect(() => {
    (async () => {
      setEntries(await loadEntries());
    })();
  }, []);

  const rate = useMemo(() => growthPerMonth(entries), [entries]);
  const weeks = useMemo(() => recommendRecolorWeeks(rate ?? AVG_US_IN_PER_MONTH), [rate]);

  // ---------- Manual save ----------
  const saveManual = async () => {
    if (!manualLen || isNaN(Number(manualLen))) return;
    const length = Number(manualLen);
    const next = await addEntry({
      dateISO: new Date().toISOString(),
      method: 'manual',
      length,
      unit,
    });
    setEntries(next);
    Alert.alert('Saved', 'Length added to your timeline.');
  };

  // ---------- Photo flow ----------
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const savePhotoMeasurement = async () => {
    if (!photoUri) return;
    const next = await addEntry({
      dateISO: new Date().toISOString(),
      method: 'photo',
      length: overlayLen,
      unit,
      photoUri,
    });
    setEntries(next);
    setPhotoUri(null);
    Alert.alert('Saved', 'Photo measurement added.');
  };

  // ---------- Notifications ----------
  const enableReminders = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Notification permission is required.');
      return;
    }
    // Cancel old
    await Notifications.cancelAllScheduledNotificationsAsync();
    // Schedule every recommendRecolorWeeks
    const intervalDays = Math.round(weeks * 7);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ OmniTint reminder',
        body:
          rate
            ? `Your growth is ~${(rate * 2.54).toFixed(1)} cm/mo. Time to review shades or touch-ups.`
            : `Time to review shades or touch-ups.`,
        data: { screen: 'ProductBundleScreen' },
      },
      trigger: { seconds: intervalDays * 24 * 60 * 60, repeats: true },
    });
    setReminders(true);
    Alert.alert('Enabled', `Reminders every ~${intervalDays} days.`);
  };

  const disableReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setReminders(false);
    Alert.alert('Disabled', 'Reminders turned off.');
  };

  // ---------- UI helpers ----------
  const UnitToggle = () => (
    <View style={styles.segment}>
      {['in', 'cm'].map((u) => (
        <TouchableOpacity
          key={u}
          style={[styles.segBtn, unit === u && styles.segBtnActive]}
          onPress={() => {
            if (unit !== u) {
              // convert visible values when switching unit
              if (u === 'cm') {
                setManualLen(parseFloat(toCm(manualLen, 'in').toFixed(2)));
                setOverlayLen(parseFloat(toCm(overlayLen, 'in').toFixed(2)));
              } else {
                setManualLen(parseFloat(toInches(manualLen, 'cm').toFixed(2)));
                setOverlayLen(parseFloat(toInches(overlayLen, 'cm').toFixed(2)));
              }
              setUnit(u);
            }
          }}
        >
          <Text style={[styles.segText, unit === u && styles.segTextActive]}>{u.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEntry = ({ item }) => (
    <View style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <FontAwesome5 name="ruler-vertical" color="#555" size={14} />
          </View>
        )}
        <View>
          <Text style={styles.rowTitle}>
            {item.length.toFixed(2)}{item.unit}
          </Text>
          <Text style={styles.rowSub}>
            {new Date(item.dateISO).toLocaleDateString()} • {item.method === 'photo' ? 'Photo' : 'Manual'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeEntry(item.id).then(setEntries)}>
        <FontAwesome5 name="trash-alt" size={16} color="#999" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ListHeaderComponent={
            <>
              <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
                <Text style={styles.h1}>Progress Tracker</Text>
                <Text style={styles.sub}>
                  Track growth over time and get smart touch-up reminders.
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Your rate</Text>
                  <Text style={styles.statValue}>
                    {rate ? `${rate.toFixed(2)} in/mo` : '—'}
                  </Text>
                  <Text style={styles.statTiny}>
                    Avg: {AVG_US_IN_PER_MONTH} in/mo
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Reminder cadence</Text>
                  <Text style={styles.statValue}>{Math.round(weeks)} wks</Text>
                  <TouchableOpacity
                    style={[styles.pill, reminders ? styles.pillOn : styles.pillOff]}
                    onPress={reminders ? disableReminders : enableReminders}
                  >
                    <Text style={[styles.pillText, reminders && { color: '#fff' }]}>
                      {reminders ? 'On' : 'Enable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mode toggle */}
              <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
                <View style={styles.segment}>
                  {['manual', 'photo'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.segBtn, mode === m && styles.segBtnActive]}
                      onPress={() => setMode(m)}
                    >
                      <Text style={[styles.segText, mode === m && styles.segTextActive]}>
                        {m === 'manual' ? 'Manual' : 'Photo'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Input Area */}
              <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={styles.cardTitle}>
                      {mode === 'manual' ? 'Add length' : 'Measure from photo'}
                    </Text>
                    <UnitToggle />
                  </View>

                  {mode === 'manual' ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                          value={String(manualLen)}
                          onChangeText={(t) => setManualLen(Number(t.replace(/[^\d.]/g, '')) || 0)}
                          keyboardType="decimal-pad"
                          style={styles.input}
                          placeholder={`0 ${unit}`}
                          placeholderTextColor="#999"
                        />
                        <View style={{ marginLeft: 12 }}>
                          <LengthRuler
                            min={0}
                            max={unit === 'in' ? 40 : 100}
                            step={unit === 'in' ? 0.25 : 0.5}
                            unit={unit}
                            value={manualLen}
                            onChange={setManualLen}
                            height={220}
                          />
                        </View>
                      </View>

                      <TouchableOpacity style={styles.primaryBtn} onPress={saveManual}>
                        <FontAwesome5 name="save" color="#fff" size={14} />
                        <Text style={styles.primaryText}>Save</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {photoUri ? (
                        <View style={{ alignItems: 'center' }}>
                          <ImageBackground
                            source={{ uri: photoUri }}
                            style={styles.photo}
                            imageStyle={{ borderRadius: 16 }}
                          >
                            {/* Overlay ruler on the right edge */}
                            <View style={styles.overlay}>
                              <LengthRuler
                                min={0}
                                max={unit === 'in' ? 40 : 100}
                                step={unit === 'in' ? 0.25 : 0.5}
                                unit={unit}
                                value={overlayLen}
                                onChange={setOverlayLen}
                                height={280}
                                compact
                              />
                            </View>
                          </ImageBackground>
                          <View style={{ flexDirection: 'row', marginTop: 12 }}>
                            <TouchableOpacity
                              style={[styles.secondaryBtn, { marginRight: 10 }]}
                              onPress={() => setPhotoUri(null)}
                            >
                              <Text style={styles.secondaryText}>Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryBtn} onPress={savePhotoMeasurement}>
                              <FontAwesome5 name="save" color="#fff" size={14} />
                              <Text style={styles.primaryText}>Save</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.primaryBtn} onPress={pickPhoto}>
                          <FontAwesome5 name="camera" color="#fff" size={14} />
                          <Text style={styles.primaryText}>Take back photo</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>

              {/* History */}
              <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                <Text style={styles.sectionTitle}>History</Text>
              </View>
            </>
          }
          data={entries}
          keyExtractor={(it) => it.id}
          renderItem={renderEntry}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: '#111' },
  sub: { color: '#6A6A6A', marginTop: 4 },
  stats: {
    paddingHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statLabel: { color: '#666', fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111' },
  statTiny: { marginTop: 2, color: '#9A9A9A', fontSize: 12 },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillOn: { backgroundColor: '#111', borderColor: '#111' },
  pillOff: { borderColor: '#111' },
  pillText: { color: '#111', fontWeight: '700', fontSize: 12 },
  segment: {
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
  },
  segBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  segBtnActive: { backgroundColor: '#111' },
  segText: { color: '#111', fontWeight: '700' },
  segTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: { fontWeight: '800', color: '#111', fontSize: 16 },
  input: {
    width: 110,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111',
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginRight: 8,
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  primaryText: {
    color: '#fff', fontWeight: '800', marginLeft: 8,
  },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#111', borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  secondaryText: { color: '#111', fontWeight: '800' },
  photo: { width: '100%', height: 320, borderRadius: 16, overflow: 'hidden' },
  overlay: {
    position: 'absolute', right: 8, top: 20, bottom: 20, justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 12, paddingHorizontal: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 8 },
  row: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowTitle: { fontWeight: '800', fontSize: 16, color: '#111' },
  rowSub: { color: '#7A7A7A', marginTop: 2, fontSize: 12 },
  thumb: { width: 46, height: 46, borderRadius: 10, marginRight: 10 },
  thumbEmpty: { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
});
