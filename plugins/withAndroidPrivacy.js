/**
 * Expo config plugin: Android privacy hardening for Oppuna.
 *
 * - Disables Android Auto Backup / cloud restore of app data
 * - Adds backup_rules.xml and data_extraction_rules.xml exclusions
 * - Provides a React Native module to toggle FLAG_SECURE on sensitive screens
 */

const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <!-- Oppuna wellness data must remain on-device only. -->
    <exclude domain="database" path="." />
    <exclude domain="sharedpref" path="." />
    <exclude domain="file" path="." />
    <exclude domain="root" path="." />
    <exclude domain="external" path="." />
</full-backup-content>
`;

const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="file" path="." />
        <exclude domain="root" path="." />
        <exclude domain="external" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="file" path="." />
        <exclude domain="root" path="." />
        <exclude domain="external" path="." />
    </device-transfer>
</data-extraction-rules>
`;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileIfChanged(filePath, contents) {
  ensureDir(path.dirname(filePath));
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === contents) {
    return;
  }
  fs.writeFileSync(filePath, contents, 'utf8');
}

function withBackupRulesFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const resXml = path.join(
        cfg.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      writeFileIfChanged(path.join(resXml, 'backup_rules.xml'), BACKUP_RULES_XML);
      writeFileIfChanged(
        path.join(resXml, 'data_extraction_rules.xml'),
        DATA_EXTRACTION_RULES_XML,
      );
      return cfg;
    },
  ]);
}

function withManifestBackupDisabled(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest.manifest.application?.[0];
    if (!app) return cfg;

    app.$['android:allowBackup'] = 'false';
    app.$['android:fullBackupContent'] = '@xml/backup_rules';
    app.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';

    return cfg;
  });
}

function withSecureScreenModule(config) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const javaPackagePath = path.join(
        cfg.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'oppuna',
        'app',
      );
      ensureDir(javaPackagePath);

      writeFileIfChanged(
        path.join(javaPackagePath, 'OppunaSecureScreenModule.kt'),
        `package com.oppuna.app

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class OppunaSecureScreenModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "OppunaSecureScreen"

  @ReactMethod
  fun setSecure(enabled: Boolean) {
    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity ?: return@runOnUiThread
      if (enabled) {
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
      } else {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
      }
    }
  }
}
`,
      );

      writeFileIfChanged(
        path.join(javaPackagePath, 'OppunaSecureScreenPackage.kt'),
        `package com.oppuna.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class OppunaSecureScreenPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(OppunaSecureScreenModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
`,
      );

      return cfg;
    },
  ]);

  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('OppunaSecureScreenPackage')) {
      if (contents.includes('PackageList(this).packages.apply')) {
        contents = contents.replace(
          /PackageList\(this\)\.packages\.apply\s*\{/,
          `PackageList(this).packages.apply {\n              add(OppunaSecureScreenPackage())`,
        );
      } else if (contents.includes('packages.apply')) {
        contents = contents.replace(
          /packages\.apply\s*\{/,
          `packages.apply {\n              add(OppunaSecureScreenPackage())`,
        );
      }
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withAndroidPrivacy(config) {
  config = withBackupRulesFiles(config);
  config = withManifestBackupDisabled(config);
  config = withSecureScreenModule(config);
  return config;
}

module.exports = createRunOncePlugin(withAndroidPrivacy, 'oppuna-android-privacy', '1.0.0');
