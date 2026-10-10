// RevenueCat: with Expo's default singleTask, leaving the app during a purchase (bank app, 3-D Secure) cancels it.
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withSingleTopActivity(config) {
  return withAndroidManifest(config, (mod) => {
    const activities = mod.modResults.manifest.application?.[0]?.activity ?? [];
    const main = activities.find((activity) => activity.$['android:name'] === '.MainActivity');
    if (main) main.$['android:launchMode'] = 'singleTop';
    return mod;
  });
};
