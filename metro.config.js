// client/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ Allow images, fonts, videos, JSON, etc.
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg', 'js', 'json', 'ts', 'tsx'];
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'mp4', 'ttf', 'otf');

// ✅ Enable Hermes-friendly source maps + SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    ecma: 8,
    keep_classnames: true,
    keep_fnames: true,
    module: true,
  },
};

module.exports = config;
