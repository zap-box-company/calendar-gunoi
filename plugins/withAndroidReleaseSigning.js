/**
 * Expo config plugin: configures android/app/build.gradle so that
 *   ./gradlew assembleRelease  -> signed universal APK (all 4 ABIs)
 *   ./gradlew bundleRelease    -> signed AAB (Google Play)
 *
 * Signing credentials are read from credentials/keystore.properties (outside
 * the generated android/ folder, git-ignored) or from environment variables:
 *   GUNOI_UPLOAD_STORE_FILE, GUNOI_UPLOAD_STORE_PASSWORD,
 *   GUNOI_UPLOAD_KEY_ALIAS, GUNOI_UPLOAD_KEY_PASSWORD
 * If neither is present the release build falls back to the debug keystore
 * (installable, but NOT acceptable for store upload).
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @gunoi-release-signing';

const HEADER = `${MARKER}
def gunoiSigning = new Properties()
def gunoiSigningFile = rootProject.file("../credentials/keystore.properties")
if (gunoiSigningFile.exists()) {
    gunoiSigningFile.withInputStream { gunoiSigning.load(it) }
}
def gunoiSigningValue = { String key, String envKey ->
    System.getenv(envKey) ?: gunoiSigning.getProperty(key)
}
def gunoiStoreFilePath = gunoiSigningValue("storeFile", "GUNOI_UPLOAD_STORE_FILE")
def gunoiStoreFile = null
if (gunoiStoreFilePath) {
    gunoiStoreFile = new File(gunoiStoreFilePath).isAbsolute()
        ? new File(gunoiStoreFilePath)
        : new File(gunoiSigningFile.parentFile, gunoiStoreFilePath)
}
def gunoiHasReleaseKey = gunoiStoreFile != null && gunoiStoreFile.exists()
if (!gunoiHasReleaseKey) {
    logger.warn("⚠ No release keystore found (credentials/keystore.properties). Release builds will use the DEBUG key.")
}

`;

const RELEASE_SIGNING_CONFIG = `
        release {
            if (gunoiHasReleaseKey) {
                storeFile gunoiStoreFile
                storePassword gunoiSigningValue("storePassword", "GUNOI_UPLOAD_STORE_PASSWORD")
                keyAlias gunoiSigningValue("keyAlias", "GUNOI_UPLOAD_KEY_ALIAS")
                keyPassword gunoiSigningValue("keyPassword", "GUNOI_UPLOAD_KEY_PASSWORD")
                enableV1Signing true
                enableV2Signing true
            }
        }`;

function applySigning(src) {
  if (src.includes(MARKER)) return src;

  const androidIdx = src.search(/^android\s*\{/m);
  if (androidIdx < 0) throw new Error('[withAndroidReleaseSigning] could not find android { } block');
  src = src.slice(0, androidIdx) + HEADER + src.slice(androidIdx);

  const sigIdx = src.indexOf('signingConfigs {');
  if (sigIdx < 0) throw new Error('[withAndroidReleaseSigning] could not find signingConfigs { } block');
  const insertAt = sigIdx + 'signingConfigs {'.length;
  src = src.slice(0, insertAt) + RELEASE_SIGNING_CONFIG + src.slice(insertAt);

  const btIdx = src.indexOf('buildTypes {');
  const relIdx = src.indexOf('release {', btIdx);
  const debugSignIdx = src.indexOf('signingConfig signingConfigs.debug', relIdx);
  if (btIdx < 0 || relIdx < 0 || debugSignIdx < 0) {
    throw new Error('[withAndroidReleaseSigning] could not find release buildType signingConfig');
  }
  src =
    src.slice(0, debugSignIdx) +
    'signingConfig gunoiHasReleaseKey ? signingConfigs.release : signingConfigs.debug' +
    src.slice(debugSignIdx + 'signingConfig signingConfigs.debug'.length);
  return src;
}

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('[withAndroidReleaseSigning] only Groovy build.gradle is supported');
    }
    cfg.modResults.contents = applySigning(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.applySigning = applySigning;
