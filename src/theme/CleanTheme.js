// client/src/theme/CleanTheme.js
import { DefaultTheme } from '@react-navigation/native';

const CleanTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E5E5',
    primary: '#000000',
  },
  typography: {
    heading: {
      fontSize: 22,
      fontWeight: '700',
      color: '#000',
    },
    subheading: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
    body: {
      fontSize: 15,
      fontWeight: '400',
      color: '#444',
    },
  },
};

export default CleanTheme;
