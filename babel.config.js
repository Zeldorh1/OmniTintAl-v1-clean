// client/babel.config.js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            '@components': './src/components',
            '@context': './src/context',
            '@data': './src/data',
            '@navigation': './navigation', // IMPORTANT: your nav folder is /client/navigation
            '@screens': './src/screens',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@assets': './assets',
          },
        },
      ],

      // must always remain last
      'react-native-reanimated/plugin',
    ],
  };
};
