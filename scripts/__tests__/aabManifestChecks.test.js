/** @jest-environment node */

const {
  compareArtifactIdentity,
  isInstallTimeDeliveryEvidence,
  MIN_TARGET_SDK,
} = require('../lib/aabManifestChecks');

describe('AAB artifact identity checks', () => {
  const expected = {
    packageId: 'com.oppuna.app',
    versionCode: 5,
    versionName: '2.0.0',
    minTargetSdk: MIN_TARGET_SDK,
  };

  function manifest(overrides = {}) {
    const versionCode = overrides.versionCode ?? 5;
    const versionName = overrides.versionName ?? '2.0.0';
    const packageId = overrides.packageId ?? 'com.oppuna.app';
    const targetSdk = overrides.targetSdk ?? 36;
    const allowBackup = overrides.allowBackup ?? 'false';
    const internet = overrides.internet ?? '';
    const includeTargetSdk = overrides.includeTargetSdk !== false;
    return `
      <manifest package="${packageId}"
        android:versionCode="${versionCode}"
        android:versionName="${versionName}">
        ${includeTargetSdk ? `<uses-sdk android:targetSdkVersion="${targetSdk}" />` : ''}
        <application android:allowBackup="${allowBackup}" />
        ${internet}
      </manifest>
    `;
  }

  it('uses minTargetSdk 36 from release config', () => {
    expect(MIN_TARGET_SDK).toBe(36);
  });

  it('passes when artifact matches expected config with targetSdk 36', () => {
    const result = compareArtifactIdentity(manifest({ targetSdk: 36 }), expected);
    expect(result.ok).toBe(true);
    expect(result.actual.versionCode).toBe(5);
    expect(result.actual.versionName).toBe('2.0.0');
    expect(result.actual.targetSdk).toBe(36);
  });

  it('passes when actual targetSdk is 37', () => {
    const result = compareArtifactIdentity(manifest({ targetSdk: 37 }), expected);
    expect(result.ok).toBe(true);
    expect(result.actual.targetSdk).toBe(37);
  });

  it('fails when actual targetSdk is 35', () => {
    const result = compareArtifactIdentity(manifest({ targetSdk: 35 }), expected);
    expect(result.ok).toBe(false);
    expect(result.failures).toContain('targetSdk');
  });

  it('fails when actual targetSdk is 34', () => {
    const result = compareArtifactIdentity(manifest({ targetSdk: 34 }), expected);
    expect(result.failures).toContain('targetSdk');
  });

  it('blocks when targetSdk is missing/unreadable', () => {
    const result = compareArtifactIdentity(manifest({ includeTargetSdk: false }), expected);
    expect(result.ok).toBe(false);
    expect(result.blocks).toContain('targetSdk-unreadable');
  });

  it('fails when actual versionCode mismatches', () => {
    const result = compareArtifactIdentity(manifest({ versionCode: 4 }), expected);
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
