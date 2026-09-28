/**
 * Expo config. app.json stays the production source of truth for CI.
 * OPPUNA_VOICE_APK=1 builds a test APK that can reach AssemblyAI.
 */
const base = require('./app.json');

module.exports = () => {
  const expo = JSON.parse(JSON.stringify(base.expo));
  if (process.env.OPPUNA_VOICE_APK === '1') {
    expo.android.blockedPermissions = (expo.android.blockedPermissions || []).filter(
      (permission) => permission !== 'android.permission.INTERNET',
    );
    const permissions = new Set(expo.android.permissions || []);
    permissions.add('android.permission.INTERNET');
    expo.android.permissions = [...permissions];
    expo.android.usesCleartextTraffic = true;
    expo.updates = { ...(expo.updates || {}), enabled: false };
    expo.extra = { ...(expo.extra || {}), voiceTestApk: true };
  }
  return { expo };
};
