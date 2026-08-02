#!/usr/bin/env node
/**
 * Reports Android release configuration from app.json and generated Gradle (if present).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_JSON = path.join(ROOT, 'app.json');
const BUILD_GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');
const MANIFEST = path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

function readExpoDefaultSdk() {
  const pluginPath = path.join(
    ROOT,
    'node_modules',
    'expo-modules-core',
    'expo-module-gradle-plugin',
    'src',
    'main',
    'kotlin',
    'expo',
    'modules',
    'plugin',
    'ProjectConfiguration.kt',
  );
  if (!fs.existsSync(pluginPath)) return { targetSdk: null, compileSdk: null, minSdk: null };
  const src = fs.readFileSync(pluginPath, 'utf8');
  const targetMatch = src.match(/targetSdkVersion['"],\s*(\d+)/);
  return {
    targetSdk: targetMatch ? Number(targetMatch[1]) : null,
    compileSdk: targetMatch ? Number(targetMatch[1]) : null,
    minSdk: 24,
  };
}

function manifestRemovesInternet(manifest) {
  return /<uses-permission[^>]*INTERNET[^>]*tools:node="remove"/.test(manifest);
}

function manifestAllowsBackup(manifest) {
  const match = manifest.match(/android:allowBackup="(true|false)"/);
  return match ? match[1] === 'true' : null;
}

function ensureAndroidProject() {
  if (fs.existsSync(BUILD_GRADLE)) return;
  execSync('npx expo prebuild --platform android --no-install --clean', {
    cwd: ROOT,
    stdio: 'pipe',
    env: { ...process.env, CI: '1' },
  });
}

function main() {
  const failures = [];
  const app = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  const android = app.expo?.android ?? {};
  const expoSdkDefaults = readExpoDefaultSdk();

  const report = {
    applicationId: android.package ?? null,
    versionName: app.expo?.version ?? null,
    versionCode: android.versionCode ?? null,
    allowBackupConfig: android.allowBackup ?? null,
    internetBlocked: (android.blockedPermissions ?? []).includes('android.permission.INTERNET'),
    internetExplicit: (android.permissions ?? []).includes('android.permission.INTERNET'),
    modelId: app.expo?.extra?.localLlm?.modelId ?? null,
    modelPack: app.expo?.extra?.localLlm?.assetPack ?? null,
    compileSdk: expoSdkDefaults.compileSdk,
    targetSdk: expoSdkDefaults.targetSdk,
    minSdk: expoSdkDefaults.minSdk,
  };

  if (report.applicationId !== 'com.oppuna.care') {
    failures.push(`Unexpected applicationId: ${report.applicationId}`);
  }
  if (report.internetExplicit) failures.push('INTERNET permission is explicitly requested');
  if (!report.internetBlocked) failures.push('INTERNET permission is not blocked in app.json');
  if (report.allowBackupConfig !== false) failures.push('allowBackup is not false in app.json');

  if (report.targetSdk !== null && report.targetSdk < 36) {
    failures.push(`targetSdk ${report.targetSdk} is below required minimum (36+)`);
  }

  try {
    ensureAndroidProject();

    if (fs.existsSync(MANIFEST)) {
      const manifest = fs.readFileSync(MANIFEST, 'utf8');
      report.manifestAllowBackup = manifestAllowsBackup(manifest);
      report.manifestInternetRemoved = manifestRemovesInternet(manifest);

      if (report.manifestAllowBackup !== false) {
        failures.push('Manifest allowBackup is not false');
      }
      if (!report.manifestInternetRemoved) {
        failures.push('Manifest does not remove INTERNET permission (tools:node="remove")');
      }
    } else {
      failures.push('AndroidManifest.xml not found after prebuild');
    }
  } catch (error) {
    failures.push(`Android project inspection failed: ${error.message}`);
  }

  console.log(JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    console.error('\nAndroid release inspection FAILED:\n');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('\nAndroid release inspection passed.');
}

main();
