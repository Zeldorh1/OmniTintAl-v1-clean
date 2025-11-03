const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// --- Handle SVGs and custom extensions ---
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg'
);
config.resolver.sourceExts.push('svg', 'pro.js');

// --- Transform SVGs ---
config.transformer.babelTransformerPath = require.resolve(
  'react-native-svg-transformer'
);

module.exports = config;
