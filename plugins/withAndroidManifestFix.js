const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidManifestFix(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    manifest.manifest.$ = manifest.manifest.$ || {};
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const application = manifest.manifest.application?.[0];
    if (application) {
      application.$ = application.$ || {};
      application.$['tools:replace'] = 'android:appComponentFactory';
    }
    return config;
  });
};
