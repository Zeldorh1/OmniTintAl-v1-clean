console.log('✅ METRO CONFIG LOADED');
// client/metro.config.js
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// ✅ Keep your SVG setup (if you use SVGs)
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg', 'ts', 'tsx'];

// ✅ Keep your 3D/video asset support
config.resolver.assetExts = [
  ...new Set([...config.resolver.assetExts, 'glb', 'gltf', 'bin', 'mp4', 'mov', 'm4v', 'avi']),
];

// ✅ THE FIX: Metro alias map (so @context/* resolves)
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
