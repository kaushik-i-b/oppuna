#!/usr/bin/env node
/**
 * Ensures Android backup is disabled in Expo config and generated manifest (when present).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_JSON = path.join(ROOT, 'app.json');
const MANIFEST = path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const PLUGIN = path.join(ROOT, 'plugins', 'withAndroidPrivacy.js');

function main() {
  const failures = [];

  const app = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  if (app.expo?.android?.allowBackup !== false) {
    failures.push('app.json: expo.android.allowBackup must be false');
  }

  const plugins = app.expo?.plugins ?? [];
  const hasPrivacyPlugin = plugins.some(
    (p) => p === './plugins/withAndroidPrivacy.js' || p?.[0] === './plugins/withAndroidPrivacy.js',
  );
  if (!hasPrivacyPlugin) {
    failures.push('app.json: must include ./plugins/withAndroidPrivacy.js plugin');
  }

  if (!fs.existsSync(PLUGIN)) {
    failures.push('plugins/withAndroidPrivacy.js is missing');
  } else {
    const pluginSrc = fs.readFileSync(PLUGIN, 'utf8');
    if (!pluginSrc.includes("android:allowBackup'] = 'false'")) {
      failures.push('withAndroidPrivacy.js must set android:allowBackup to false');
    }
    if (!pluginSrc.includes('backup_rules.xml')) {
      failures.push('withAndroidPrivacy.js must configure backup_rules.xml');
    }
    if (!pluginSrc.includes('data_extraction_rules.xml')) {
      failures.push('withAndroidPrivacy.js must configure data_extraction_rules.xml');
    }
  }

  if (fs.existsSync(MANIFEST)) {
    const manifest = fs.readFileSync(MANIFEST, 'utf8');
    if (!/android:allowBackup="false"/.test(manifest)) {
      failures.push('AndroidManifest.xml: android:allowBackup must be "false"');
    }
  } else {
    // Generate manifest via prebuild for CI validation when android/ is absent.
    try {
      execSync('npx expo prebuild --platform android --no-install --clean', {
        cwd: ROOT,
        stdio: 'pipe',
        env: { ...process.env, CI: '1' },
      });
      if (fs.existsSync(MANIFEST)) {
        const manifest = fs.readFileSync(MANIFEST, 'utf8');
        if (!/android:allowBackup="false"/.test(manifest)) {
          failures.push('Generated AndroidManifest.xml: android:allowBackup must be "false"');
        }
        const backupRules = path.join(
          ROOT,
          'android',
          'app',
          'src',
          'main',
          'res',
          'xml',
          'backup_rules.xml',
        );
        if (!fs.existsSync(backupRules)) {
          failures.push('Generated backup_rules.xml is missing');
        }
      } else {
        failures.push('expo prebuild did not produce AndroidManifest.xml');
      }
    } catch (error) {
      failures.push(`Could not run expo prebuild to verify manifest: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error('Privacy config validation FAILED:\n');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('Privacy config validation passed.');
}

main();
