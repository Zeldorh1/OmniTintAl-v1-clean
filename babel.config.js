module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.pro.js'],
          alias: {
            '@components': './src/components',
            '@context': './src/context',
            '@data': './src/data',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@assets': './assets',
          },
        },
      ],
      // 👇 must always remain last
      'react-native-reanimated/plugin',
    ],
  };
};
