// src/screens/LoginScreen.js — FLAGSHIP AUTH + PREMIUM BRANDING

import React, { useRef, useEffect, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // If already signed in, jump to MainTabs
  useEffect(() => {
    if (user) {
      navigation.replace('MainTabs');
    }
  }, [user, navigation]);

  const handleEmailPress = () => setShowEmailForm(true);

  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    try {
      // Try sign in first
      await signInWithEmail(trimmedEmail, password);
    } catch (err) {
      const code = err?.code || '';

      if (code === 'auth/user-not-found') {
        Alert.alert(
          'Create account?',
          'No account found for this email. Create a new one?',
          [
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
          ]
        );
      } else {
        Alert.alert('Sign in failed', err?.message || 'Please try again.');
      }
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert(
        'Google sign-in',
        err?.message ||
          'Google sign-in is not fully configured yet. Please try email login for now.'
      );
    }
  };

  const openTerms = () =>
    Linking.openURL('https://luxwavelabs.com/terms').catch(() => {});
  const openPrivacy = () =>
    Linking.openURL('https://luxwavelabs.com/privacy').catch(() => {});

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
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
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={handleEmailPress}
            disabled={loading}
          >
            <Text style={styles.buttonOutlineText}>
              {showEmailForm ? 'Use Email Below' : 'Continue with Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Text style={styles.buttonOutlineText}>Continue with Google</Text>
          </TouchableOpacity>

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
  brandRow: {
    flexDirection: 'row',
  },
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
    marginTop: -4, // soft superscript effect
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
});
