export default ({ config }) => {
  const isEAS = process.env.EAS_BUILD === 'true';

  return {
    ...config,

    plugins: [
      ...(isEAS
        ? [
            // ✅ ENABLE ONLY IN CLOUD
            'react-native-vision-camera',
          ]
        : [
            // ❌ DISABLE LOCALLY (Termux-safe)
          ]),
    ],
  };
};
