/** @jest-environment node */

const {
  compareArtifactIdentity,
  isInstallTimeDeliveryEvidence,
} = require('../lib/aabManifestChecks');

describe('AAB artifact identity checks', () => {
  const expected = {
    packageId: 'com.oppuna.app',
    versionCode: 4,
    versionName: '1.2.0',
  };

  function manifest(overrides = {}) {
    const versionCode = overrides.versionCode ?? 4;
    const versionName = overrides.versionName ?? '1.2.0';
    const packageId = overrides.packageId ?? 'com.oppuna.app';
    const targetSdk = overrides.targetSdk ?? 36;
    const allowBackup = overrides.allowBackup ?? 'false';
    const internet = overrides.internet ?? '';
    return `
      <manifest package="${packageId}"
        android:versionCode="${versionCode}"
        android:versionName="${versionName}">
        <uses-sdk android:targetSdkVersion="${targetSdk}" />
        <application android:allowBackup="${allowBackup}" />
        ${internet}
      </manifest>
    `;
  }

  it('passes when artifact matches expected config', () => {
    const result = compareArtifactIdentity(manifest(), expected);
    expect(result.ok).toBe(true);
    expect(result.actual.versionCode).toBe(4);
    expect(result.actual.versionName).toBe('1.2.0');
  });

  it('fails when actual versionCode mismatches', () => {
    const result = compareArtifactIdentity(manifest({ versionCode: 5 }), expected);
    expect(result.ok).toBe(false);
    expect(result.failures).toContain('versionCode');
  });

  it('fails when actual versionName mismatches', () => {
    const result = compareArtifactIdentity(manifest({ versionName: '9.9.9' }), expected);
    expect(result.failures).toContain('versionName');
  });

  it('fails when package ID is wrong', () => {
    const result = compareArtifactIdentity(manifest({ packageId: 'com.other.app' }), expected);
    expect(result.failures).toContain('packageId');
  });

  it('fails when INTERNET permission is present without remove', () => {
    const result = compareArtifactIdentity(
      manifest({
        internet: '<uses-permission android:name="android.permission.INTERNET" />',
      }),
      expected,
    );
    expect(result.failures).toContain('INTERNET');
  });

  it('fails when allowBackup is true', () => {
    const result = compareArtifactIdentity(manifest({ allowBackup: 'true' }), expected);
    expect(result.failures).toContain('allowBackup');
  });

  it('fails when targetSdk is too low', () => {
    const result = compareArtifactIdentity(manifest({ targetSdk: 33 }), expected);
    expect(result.failures).toContain('targetSdk');
  });
});

describe('install-time delivery evidence', () => {
  it('accepts install-time evidence', () => {
    expect(isInstallTimeDeliveryEvidence('deliveryType = "install-time"')).toBe(true);
    expect(isInstallTimeDeliveryEvidence('INSTALL_TIME')).toBe(true);
  });

  it('rejects on-demand-only evidence', () => {
    expect(isInstallTimeDeliveryEvidence('deliveryType = "on-demand"')).toBe(false);
  });
});
