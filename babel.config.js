module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@components': './src/components',
            '@context': './src/context',
            '@data': './src/data',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@assets': './src/assets',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      // 👇 MUST be the last plugin
      'react-native-reanimated/plugin',
    ],
  };
};
