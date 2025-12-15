import React, { useState } from 'react';
import { View, Text } from 'react-native';
import assets from '@/utils/ar/assets.json'; // keep if your alias '@' works; otherwise use ../../utils/ar/assets.json

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function AR360PreviewScreen() {
  const [perm, setPerm] = useState(null);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>AR 360 Preview — Coming Soon</Text>
    </View>
  );
}
