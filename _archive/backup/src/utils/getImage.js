import { Image } from 'react-native';
import placeholder from '@assets/placeholder.png';

export const getImage = (path) => {
  try {
    return require(`@assets/${path}`);
  } catch {
    console.warn(`⚠️ Missing asset: ${path}, using placeholder`);
    return placeholder;
  }
};
