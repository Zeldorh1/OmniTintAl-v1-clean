// client/app.config.js
export default ({ config }) => {
  // EAS_BUILD is set on EAS build machines
  const isEAS = process.env.EAS_BUILD === 'true' || !!process.env.EAS_BUILD;

  // Keep any plugins already defined elsewhere
  const basePlugins = Array.isArray(config.plugins) ? config.plugins : [];

  // Native plugins that should only run on real builds (EAS / native)
  const easOnlyPlugins = [
    // ✅ Required by expo-mail-composer install message
    'expo-mail-composer',

    // ✅ Vision Camera plugin config
    [
      'react-native-vision-camera',
      {
        cameraPermissionText: 'Allow ${PRODUCT_NAME} to access your camera',
        enableFrameProcessors: true,
      },
    ],
  ];

  return {
    ...config,

    // ✅ Merge plugins safely (do not clobber)
    plugins: [
      ...basePlugins,
      ...(isEAS ? easOnlyPlugins : []),
    ],
  };
};
