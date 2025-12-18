// client/metro.config.js
console.log('✅ METRO CONFIG LOADED');

const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// ✅ Always keep TS/TSX
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), 'ts', 'tsx'])
);

// ✅ Optional SVG transformer (only enable if installed)
try {
  require.resolve('react-native-svg-transformer');

  config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

  config.resolver.assetExts = (config.resolver.assetExts || []).filter((ext) => ext !== 'svg');
  config.resolver.sourceExts = Array.from(new Set([...(config.resolver.sourceExts || []), 'svg']));

  console.log('✅ SVG transformer enabled');
} catch (e) {
  console.log('⚠️ SVG transformer not installed — skipping SVG setup');
}

// ✅ Keep your 3D/video asset support
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts || []), 'glb', 'gltf', 'bin', 'mp4', 'mov', 'm4v'])
);

// ✅ Keep your alias map exactly like you had it
config.resolver.extraNodeModules = {
  '@components': path.resolve(projectRoot, 'src/components'),
  '@context': path.resolve(projectRoot, 'src/context'),
  '@data': path.resolve(projectRoot, 'src/data'),
  '@navigation': path.resolve(projectRoot, 'navigation'),
  '@screens': path.resolve(projectRoot, 'src/screens'),
  '@theme': path.resolve(projectRoot, 'src/theme'),
  '@utils': path.resolve(projectRoot, 'src/utils'),
  '@assets': path.resolve(projectRoot, 'assets'),
  '@icons': path.resolve(projectRoot, 'assets/icons'),
};

module.exports = config;
