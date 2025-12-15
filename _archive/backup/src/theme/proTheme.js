
// Design tokens for the Pro baseline (non-breaking; separate from your existing theme files).
export const colors = {
  light: {
    bg: '#FFFFFF',
    text: '#121212',
    muted: '#6B7280',
    card: '#F8FAFC',
    primary: '#111827',
    gold: '#E7C158',
    danger: '#EF4444',
  },
  dark: {
    bg: '#0B0B0B',
    text: '#F5F5F5',
    muted: '#9CA3AF',
    card: '#111318',
    primary: '#F5F5F5',
    gold: '#E7C158',
    danger: '#F87171',
  }
};

export const gradients = {
  brand: ['#FDAE5F', '#FAE0E1'], // warm sand -> soft blush
  premium: ['#2B2B2B', '#111111'], // subtle depth for premium surfaces
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.3 },
  h2: { fontSize: 22, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 12, opacity: 0.8 },
};
