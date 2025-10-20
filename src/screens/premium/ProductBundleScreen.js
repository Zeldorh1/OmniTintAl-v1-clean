import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';

const filtersList = ['Organic', 'Vegan', 'Cruelty-Free', 'Paraben-Free', 'Sulfate-Free'];

const bundles = [
  {
    id: 'budget',
    title: 'Budget Bundle',
    price: '$25',
    items: [
      { id: '1', name: 'Shampoo', price: '$8.99', img: require('@assets/placeholder.png') },
      { id: '2', name: 'Conditioner', price: '$9.99', img: require('@assets/placeholder.png') },
      { id: '3', name: 'Brush', price: '$6.99', img: require('@assets/placeholder.png') },
    ],
  },
  {
    id: 'standard',
    title: 'Standard Bundle',
    price: '$40',
    items: [
      { id: '4', name: 'Bond Repair', price: '$14.99', img: require('@assets/placeholder.png') },
      { id: '5', name: 'Hair Mask', price: '$10.99', img: require('@assets/placeholder.png') },
      { id: '6', name: 'Comb', price: '$6.99', img: require('@assets/placeholder.png') },
    ],
  },
  {
    id: 'premium',
    title: 'Premium Bundle',
    price: '$60',
    items: [
      { id: '7', name: 'Serum', price: '$18.99', img: require('@assets/placeholder.png') },
      { id: '8', name: 'Deep Repair', price: '$20.99', img: require('@assets/placeholder.png') },
      { id: '9', name: 'Luxury Mask', price: '$24.99', img: require('@assets/placeholder.png') },
    ],
  },
];

export default function ProductBundleScreen() {
  const [filters, setFilters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const nav = useNavigation();
  const t = useTheme();

  const toggleFilter = (filter) => {
    setFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleAddBundle = () => {
    // Simulate logic for result routing
    const drynessDetected = Math.random() > 0.5; // Placeholder logic
    if (drynessDetected) {
      nav.navigate('HairHealthResultRecovery');
    } else {
      nav.navigate('HairHealthResultGood');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: t.colors.text }]}>
          Your scan shows signs of dryness and split ends.
        </Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="options-outline" size={24} color={t.colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtext, { color: t.colors.muted }]}>
        Here’s a recovery bundle to help repair and protect your hair for the next 30 days.
      </Text>

      {/* Modal Filters */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: t.colors.card }]}>
            <Text style={[styles.filterTitle, { color: t.colors.text }]}>Filters</Text>
            {filtersList.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={styles.filterRow}
                onPress={() => toggleFilter(filter)}
              >
                <Ionicons
                  name={filters.includes(filter) ? 'checkbox-outline' : 'square-outline'}
                  size={20}
                  color={t.colors.text}
                />
                <Text style={[styles.filterLabel, { color: t.colors.text }]}>{filter}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: t.colors.tint }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bundles */}
      <FlatList
        data={bundles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.bundle}>
            <View style={styles.bundleHeader}>
              <Text style={[styles.bundleTitle, { color: t.colors.text }]}>{item.title}</Text>
              <Text style={[styles.bundlePrice, { color: t.colors.muted }]}>{item.price}</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={item.items}
              keyExtractor={(sub) => sub.id}
              renderItem={({ item: sub }) => (
                <View style={[styles.card, { backgroundColor: t.colors.card }]}>
                  <Image source={sub.img} style={styles.productImage} />
                  <Text style={[styles.productName, { color: t.colors.text }]}>{sub.name}</Text>
                  <Text style={[styles.productPrice, { color: t.colors.muted }]}>{sub.price}</Text>
                </View>
              )}
            />
          </View>
        )}
      />

      {/* Add Button */}
      <TouchableOpacity style={[styles.addButton, { backgroundColor: t.colors.tint }]} onPress={handleAddBundle}>
        <Text style={styles.addText}>Add Bundle to Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  subtext: {
    fontSize: 15,
    marginVertical: 15,
  },
  bundle: { marginBottom: 30 },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bundleTitle: { fontSize: 18, fontWeight: '600' },
  bundlePrice: { fontSize: 16, fontWeight: '500' },
  card: {
    width: 100,
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  productImage: { width: 50, height: 50, resizeMode: 'contain', marginBottom: 8 },
  productName: { fontSize: 13, textAlign: 'center' },
  productPrice: { fontSize: 12 },
  addButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    width: '80%',
    padding: 20,
  },
  filterTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  filterLabel: { marginLeft: 10, fontSize: 15 },
  closeButton: { marginTop: 15, borderRadius: 10, padding: 10, alignItems: 'center' },
  closeText: { color: '#FFF', fontWeight: '600' },
});
