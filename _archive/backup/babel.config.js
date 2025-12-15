module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Keep Reanimated for gesture + animation support
      'react-native-reanimated/plugin',
    ],
  };
};
