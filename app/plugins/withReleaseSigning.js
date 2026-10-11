// Signs release builds with the Google Play upload key, kept outside the repo (docs/runbook.md, "Publier sur Google Play").
// Without the properties file, release builds stay signed with the debug key, as Expo generates them.
const { withAppBuildGradle } = require('expo/config-plugins');

const LOAD_PROPERTIES = `
def detourUploadFile = new File(System.getenv('DETOUR_UPLOAD_PROPERTIES') ?: "\${System.getProperty('user.home')}/.config/detour/upload.properties")
def detourUpload = null
if (detourUploadFile.exists()) {
    detourUpload = new Properties()
    detourUploadFile.withInputStream { detourUpload.load(it) }
}

android {`;

const RELEASE_CONFIG = `signingConfigs {
        if (detourUpload != null) {
            release {
                storeFile file(detourUpload['storeFile'])
                storePassword detourUpload['storePassword']
                keyAlias detourUpload['keyAlias']
                keyPassword detourUpload['keyPassword']
            }
        }`;

const RELEASE_USES_DEBUG = /(release \{\n(?:\s*\/\/.*\n)*\s*)signingConfig = signingConfigs\.debug/;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes('detourUpload')) return mod;
    if (!RELEASE_USES_DEBUG.test(gradle))
      throw new Error('withReleaseSigning: release signingConfig not found');
    gradle = gradle.replace(/^android \{/m, LOAD_PROPERTIES.trimStart());
    gradle = gradle.replace('signingConfigs {', RELEASE_CONFIG);
    gradle = gradle.replace(
      RELEASE_USES_DEBUG,
      '$1signingConfig = detourUpload != null ? signingConfigs.release : signingConfigs.debug',
    );
    mod.modResults.contents = gradle;
    return mod;
  });
};
