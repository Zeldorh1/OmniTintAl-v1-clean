// client/src/screens/premium/AIStylesScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';
import { predict, learn, blendScores } from '../../utils/personalizer';
import { queueLabel, track } from '../../utils/telemetry';
import { analyzeAsync } from '../../components/FaceMeshWorker'; // MediaPipe analyzer

export default function AIStylesScreen({ navigation }) {
  const { settings } = useSettings();
  const [photoUri, setPhotoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [score, setScore] = useState(null);
  const dwellRef = useRef(Date.now());

  // Pick image from library or camera
  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo access to use AI Styles.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      handlePhoto(res.assets[0].uri);
    }
  }, []);

  const handlePhoto = async (uri) => {
    setBusy(true);
    setPhotoUri(uri);
    try {
      const out = await analyzeAsync(uri); // MediaPipe face mesh + attributes
      if (!out?.face || !out?.scan) throw new Error('Face not detected');
      setAnalysis(out.scan);
      await computeSuggestions(out.scan);
    } catch (err) {
      console.error(err);
      Alert.alert('Analysis failed', 'Try again with better lighting or a clearer photo.');
    } finally {
      setBusy(false);
    }
  };

  const computeSuggestions = async (scan) => {
    // Simple feature vector: use your existing hair + face ratios
    const vector = [
      scan.faceShape || 0.5,
      scan.hairline || 0.5,
      scan.forehead || 0.5,
      scan.jawline || 0.5,
      scan.cheekbone || 0.5,
    ];
    const ml = await predict(vector);
    const heuristic = (scan.forehead + scan.jawline + scan.cheekbone) / 3;
    const blended = await blendScores(heuristic, ml, 0.7);
    setScore({ blended, ml, heuristic, vector });

    // Track metadata
    track('ai_styles_analysis', { blended, ml, heuristic }, { enabled: settings.shareAnonymizedStats });

    // Example: Rank styles by match % (mock data until your ML model matures)
    const styleList = [
      { name: 'Layered Long Cut', score: blended * 0.95 },
      { name: 'Curtain Bangs', score: blended * 0.88 },
      { name: 'Pixie Taper', score: blended * 0.75 },
      { name: 'Blunt Bob', score: blended * 0.68 },
      { name: 'Soft Waves', score: blended * 0.92 },
    ];
    const ranked = styleList.sort((a, b) => b.score - a.score);
    setSuggestions(ranked);
  };

  const onThumb = async (y) => {
    if (!score?.vector) return;
    await learn(score.vector, y);
    await queueLabel(score.vector, y, 'strong', { enabled: settings.shareAnonymizedStats });
    Alert.alert(y ? 'Thanks!' : 'Got it', y ? 'Your feedback will improve AI Styles.' : 'We’ll tune future matches.');
  };

  // Implicit dwell signal
  useEffect(() => {
    const t = setInterval(() => {
      if (score?.vector && Date.now() - dwellRef.current > 7000) {
        queueLabel(score.vector, 1, 'weak_pos', { enabled: settings.shareAnonymizedStats });
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [score?.vector]);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={s.h1}>AI Suggested Styles</Text>
      <Text style={s.sub}>Upload or snap a clear, front-facing photo in good lighting.</Text>

      <TouchableOpacity style={s.btn} onPress={pickImage} disabled={busy}>
        <Ionicons name="camera-outline" size={18} color="#111" />
        <Text style={s.btnTxt}>Upload Photo</Text>
      </TouchableOpacity>

      {photoUri && (
        <Image source={{ uri: photoUri }} style={s.preview} />
      )}

      {busy && (
        <View style={s.rowCenter}>
          <ActivityIndicator />
          <Text style={{ color: '#666', marginLeft: 8 }}>Analyzing...</Text>
        </View>
      )}

      {analysis && suggestions.length > 0 && (
        <View style={s.card}>
          <Text style={s.h2}>Top Matches</Text>
          {suggestions.map((sug, idx) => (
            <View key={idx} style={s.item}>
              <Text style={s.name}>{sug.name}</Text>
              <Text style={s.score}>{Math.round(sug.score * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {score && (
        <View style={s.feedback}>
          <TouchableOpacity style={s.thumbUp} onPress={() => onThumb(1)}>
            <Text style={s.thumbTxt}>👍 Accurate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.thumbDown} onPress={() => onThumb(0)}>
            <Text style={s.thumbTxt}>👎 Off</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  h1: { fontSize: 22, fontWeight: '800', color: '#111' },
  sub: { color: '#666', marginTop: 6 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  btnTxt: { fontWeight: '800', color: '#111' },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginTop: 14,
    resizeMode: 'cover',
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 14,
    marginTop: 18,
  },
  h2: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 10 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    paddingVertical: 8,
  },
  name: { fontWeight: '600', color: '#111' },
  score: { fontWeight: '800', color: '#333' },
  feedback: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 24,
  },
  thumbUp: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  thumbDown: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  thumbTxt: { color: '#fff', fontWeight: '700' },
});
