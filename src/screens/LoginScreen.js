// client/src/screens/LoginScreen.js — FLAGSHIP AUTH (Phone + Email panels, collapsed by default)

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

// OPTIONAL: If you want the MP4 behind the login, uncomment these 2 lines
import { Video } from 'expo-av';

import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Auth can be partially implemented — we guard everything
  const auth = useAuth?.() || {};
  const user = auth.user;
  const loading = !!auth.loading;

  const signInWithEmail = auth.signInWithEmail;
  const signUpWithEmail = auth.signUpWithEmail;

  // Phone auth may not exist yet — we will provide a safe fallback
  const signInWithPhone = auth.signInWithPhone;

  // Panels
  const [activePanel, setActivePanel] = useState(null); // 'phone' | 'email' | null

  // Email inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone inputs (placeholder UI for now)
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneStep, setPhoneStep] = useState('enter'); // 'enter' | 'verify'

  const showEmailForm = activePanel === 'email';
  const showPhoneForm = activePanel === 'phone';

  // Animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // If already signed in, jump to MainTabs
  useEffect(() => {
    if (user) navigation.replace('MainTabs');
  }, [user, navigation]);

  const openTerms = () => Linking.openURL('https://luxwavelabs.com/terms').catch(() => {});
  const openPrivacy = () => Linking.openURL('https://luxwavelabs.com/privacy').catch(() => {});

  const togglePanel = (which) => {
    setActivePanel((prev) => (prev === which ? null : which));
  };

  const goMain = () => navigation.replace('MainTabs');

  // ─────────────────────────────────────────
  // EMAIL FLOW (real if functions exist, else fallback to not stuck)
  // ─────────────────────────────────────────
  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    // If auth funcs not wired yet, don’t trap user
    if (typeof signInWithEmail !== 'function' || typeof signUpWithEmail !== 'function') {
      Alert.alert(
        'Email login not wired yet',
        'Email auth is not connected in AuthContext yet — continuing to app for now.',
        [{ text: 'OK', onPress: goMain }]
      );
      return;
    }

    try {
      await signInWithEmail(trimmedEmail, password);
      // if sign-in works, user effect routes
    } catch (err) {
      const codeErr = err?.code || '';
      if (codeErr === 'auth/user-not-found') {
        Alert.alert('Create account?', 'No account found for this email. Create a new one?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: async () => {
              try {
                await signUpWithEmail(trimmedEmail, password);
              } catch (inner) {
                Alert.alert('Sign up failed', inner?.message || 'Please try again.');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Sign in failed', err?.message || 'Please try again.');
      }
    }
  };

  // ─────────────────────────────────────────
  // PHONE FLOW (placeholder UI; real if function exists)
  // ─────────────────────────────────────────
  const handlePhoneStart = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert('Missing phone', 'Please enter your phone number.');
      return;
    }

    // If not wired yet, don’t trap user
    if (typeof signInWithPhone !== 'function') {
      Alert.alert(
        'Phone login not wired yet',
        'Phone auth isn’t connected yet — continuing to app for now.',
        [{ text: 'OK', onPress: goMain }]
      );
      return;
    }

    try {
      // Expected: signInWithPhone(phone) sends code
      await signInWithPhone(trimmed);
      setPhoneStep('verify');
    } catch (err) {
      Alert.alert('Phone sign-in failed', err?.message || 'Please try again.');
    }
  };

  const handlePhoneVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Missing code', 'Enter the verification code.');
      return;
    }

    // If your real implementation needs verify step, you’ll add it in AuthContext.
    // For now, if signInWithPhone exists we assume it handles internally.
    Alert.alert('Not implemented', 'Phone verification step will be wired next.', [
      { text: 'OK', onPress: goMain },
    ]);
  };

  // ─────────────────────────────────────────
  // Background media (MP4 behind login)
  // ─────────────────────────────────────────
  const Background = useMemo(() => {
    // ✅ If you want MP4 behind the login, keep this Video enabled.
    // Ensure the path is correct:
    // client/assets/HairAppStartup.mp4  -> require('../../assets/HairAppStartup.mp4')
    return (
      <Video
        source={require('../../assets/HairAppStartup.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        shouldPlay
        isLooping
        isMuted
      />
    );
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      {/* VIDEO BEHIND EVERYTHING */}
      <View style={StyleSheet.absoluteFill}>{Background}</View>

      {/* Dark overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Brand lockup */}
        <View style={styles.topSection}>
          <Text style={styles.brandRow}>
            <Text style={styles.brandText}>OmniTintAI</Text>
            <Text style={styles.brandRegistered}>®</Text>
          </Text>
          <Text style={styles.subtitle}>Intelligent Hair. Intelligent Price.</Text>
        </View>

        {/* Auth options */}
        <View style={styles.bottomSection}>
          {/* PHONE BUTTON (TOP) */}
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => togglePanel('phone')}
            disabled={loading}
          >
            <Text style={styles.buttonOutlineText}>
              {showPhoneForm ? 'Use Phone Below' : 'Continue with phone'}
            </Text>
          </TouchableOpacity>

          {/* PHONE PANEL (collapsed by default) */}
          {showPhoneForm && (
            <View style={styles.emailCard}>
              <Text style={styles.emailTitle}>
                {phoneStep === 'enter' ? 'Enter your phone number' : 'Enter verification code'}
              </Text>

              {phoneStep === 'enter' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone number"
                    placeholderTextColor="#AAAAAA"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handlePhoneStart}
                    disabled={loading}
                  >
                    <Text style={styles.primaryBtnText}>
                      {loading ? 'Please wait…' : 'Send code'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.helper}>
                    We’ll text you a verification code.
                  </Text>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Verification code"
                    placeholderTextColor="#AAAAAA"
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
                  />

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handlePhoneVerify}
                    disabled={loading}
                  >
                    <Text style={styles.primaryBtnText}>
                      {loading ? 'Please wait…' : 'Verify & Continue'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.linkBtn]}
                    onPress={() => {
                      setPhoneStep('enter');
                      setCode('');
                    }}
                  >
                    <Text style={styles.linkBtnText}>Use a different number</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* EMAIL BUTTON (BOTTOM) */}
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => togglePanel('email')}
            disabled={loading}
          >
            <Text style={styles.buttonOutlineText}>
              {showEmailForm ? 'Use Email Below' : 'Continue with Email'}
            </Text>
          </TouchableOpacity>

          {/* EMAIL PANEL (collapsed by default) */}
          {showEmailForm && (
            <View style={styles.emailCard}>
              <Text style={styles.emailTitle}>Sign in or create an account</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Password (8+ characters)"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Please wait…' : 'Continue'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.helper}>
                We’ll automatically create a new OmniTintAI profile if you don’t have one yet.
              </Text>
            </View>
          )}

          <Text style={styles.disclaimer}>
            By tapping a login button, you agree to our{' '}
            <Text style={styles.link} onPress={openTerms}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.link} onPress={openPrivacy}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },

  topSection: { justifyContent: 'center', alignItems: 'center' },
  brandRow: { flexDirection: 'row' },
  brandText: {
    fontSize: 34,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  brandRegistered: {
    fontSize: 16,
    color: 'white',
    marginLeft: 3,
    marginTop: -4,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },

  bottomSection: { alignItems: 'center', width: '100%' },

  buttonOutline: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    marginVertical: 8,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: 'white',
  },

  emailCard: {
    width: '100%',
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emailTitle: {
    color: 'white',
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    color: 'white',
    fontSize: 14,
  },
  primaryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  helper: {
    marginTop: 8,
    fontSize: 11,
    color: '#CCCCCC',
  },

  disclaimer: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
  },
  link: { color: '#FFD700', textDecorationLine: 'underline' },

  linkBtn: { marginTop: 10, alignSelf: 'flex-start' },
  linkBtnText: { color: '#FFD700', textDecorationLine: 'underline', fontSize: 12 },
});
