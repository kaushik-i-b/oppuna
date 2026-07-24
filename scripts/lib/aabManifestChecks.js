/**
 * Pure helpers for comparing AAB manifest values to expected project config.
 */

function parseManifestAttr(xml, attr) {
  const re = new RegExp(`${attr}\\s*=\\s*"([^"]+)"`);
  const match = xml.match(re);
  return match ? match[1] : null;
}

function compareArtifactIdentity(manifestXml, expected) {
  const failures = [];
  const packageOk = manifestXml.includes(expected.packageId);
  if (!packageOk) failures.push('packageId');

  const versionCode = parseManifestAttr(manifestXml, 'android:versionCode');
  const versionName = parseManifestAttr(manifestXml, 'android:versionName');
  const targetSdk = parseManifestAttr(manifestXml, 'android:targetSdkVersion');
  const allowBackup = parseManifestAttr(manifestXml, 'android:allowBackup');

  if (versionCode === null) failures.push('versionCode-missing');
  else if (Number(versionCode) !== Number(expected.versionCode)) failures.push('versionCode');

  if (versionName === null) failures.push('versionName-missing');
  else if (versionName !== String(expected.versionName)) failures.push('versionName');

  if (targetSdk === null) failures.push('targetSdk-missing');
  else if (Number(targetSdk) < 34) failures.push('targetSdk');

  if (allowBackup !== 'false') failures.push('allowBackup');

  const internetLines = manifestXml
    .split('\n')
    .filter((l) => l.includes('android.permission.INTERNET'));
  const internetPresent = internetLines.some((l) => !l.includes('tools:node="remove"'));
  if (internetPresent) failures.push('INTERNET');

  return {
    ok: failures.length === 0,
    failures,
    actual: {
      versionCode: versionCode === null ? null : Number(versionCode),
      versionName,
      targetSdk: targetSdk === null ? null : Number(targetSdk),
      allowBackup,
      packageIdPresent: packageOk,
      internetPresent,
    },
  };
}

function isInstallTimeDeliveryEvidence(text) {
  return /install-time/i.test(text) || /INSTALL_TIME/.test(text);
}

module.exports = {
  parseManifestAttr,
  compareArtifactIdentity,
  isInstallTimeDeliveryEvidence,
};
