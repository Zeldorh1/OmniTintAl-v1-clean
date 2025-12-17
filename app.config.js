// client/app.config.js
export default ({ config }) => {
  const isEAS = process.env.EAS_BUILD === 'true';

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),

      ...(isEAS
        ? [
            [
              'react-native-vision-camera',
              {
                cameraPermissionText: 'Allow $(PRODUCT_NAME) to access your camera',
                enableFrameProcessors: true
              }
            ],
            'expo-video'
          ]
        : [])
    ]
  };
};
