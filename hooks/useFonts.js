// client/hooks/useFonts.js
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export function useFonts() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Ionicons': require('@expo/vector-icons/fonts/Ionicons.ttf'),
      'FontAwesome5': require('@expo/vector-icons/fonts/FontAwesome5_Regular.ttf'),
    }).then(() => setLoaded(true));
  }, []);

  return loaded;
}
