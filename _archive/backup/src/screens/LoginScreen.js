import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Animated } from 'react-native';
import { Video } from 'expo-av';

export default function LoginScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = () => {
    // Navigate directly to Main Tabs (replaces Login)
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        source={require('../../assets/HairAppStartup.mp4')}
        style={StyleSheet.absoluteFill}
        shouldPlay
        isLooping
        resizeMode="cover"
      />

      {/* Overlay with Fade-in */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <Text style={styles.superscript}>OmniTintAI®</Text>
          <Text style={styles.subtitle}>Intelligent Hair. Intelligent Price.</Text>
        </View>

        {/* Buttons */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.buttonOutline} onPress={handleLogin}>
            <Text style={styles.buttonOutlineText}>Continue with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonOutline} onPress={handleLogin}>
            <Text style={styles.buttonOutlineText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            By tapping a login button, you agree to our{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://luxwavelabs.com/terms')}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://luxwavelabs.com/privacy')}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  topSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  superscript: { fontSize: 36, color: 'white', fontWeight: 'bold' },
  subtitle: { fontSize: 18, color: 'white', textAlign: 'center', marginTop: 10 },
  bottomSection: { alignItems: 'center' },
  buttonOutline: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginVertical: 8,
    width: '80%',
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: 'white',
  },
  disclaimer: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  link: {
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
});
