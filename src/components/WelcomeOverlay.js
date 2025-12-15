// client/src/components/WelcomeOverlay.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';

export default function WelcomeOverlay({ visible, onClose, onUpgrade }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.tagline}>Welcome to OmniTintAI! 🎉</Text>
            <Text style={styles.title}>
              You’re one of the first to experience the future of hair.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What’s live today:</Text>
              <Text style={styles.bullet}>• Real-time AR hair try-on</Text>
              <Text style={styles.bullet}>• 360° hairstyle previews</Text>
              <Text style={styles.bullet}>• AI stylist chat</Text>
              <Text style={styles.bullet}>• Personalized product bundles</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What’s coming next:</Text>
              <Text style={styles.bullet}>• Deeper AI memory and personalization</Text>
              <Text style={styles.bullet}>• Smart tool recommendations</Text>
              <Text style={styles.bullet}>• Growth & damage forecasting</Text>
              <Text style={styles.bullet}>• Trend Radar insights</Text>
              <Text style={styles.bullet}>
                • And much more — this app will evolve continuously
              </Text>
            </View>

            <Text style={styles.note}>
              Upgrade to Premium for full access and early feature releases.
            </Text>

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                <Text style={styles.secondaryText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={onUpgrade}>
                <Text style={styles.primaryText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    marginBottom: 18,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 3,
  },
  note: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
    marginBottom: 18,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111827',
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#000',
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
