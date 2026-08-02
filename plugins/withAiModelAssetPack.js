/**
 * Expo config plugin: Google Play Asset Delivery (install-time) for the GGUF model.
 *
 * During `npx expo prebuild`, this plugin:
 * 1. Creates `android/ai_model_asset_pack/` with install-time delivery
 * 2. Wires the asset pack into Gradle
 * 3. Injects a native module (`OppunaModelAsset`) that copies install-time
 *    assets via AssetManager into app-private storage for llama.rn mmap
 * 4. Marks `.gguf` as noCompress
 *
 * Place the real model at:
 *   assets/ai-model/model.gguf
 * before building a production AAB. The file is gitignored.
 */

const {
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
  withSettingsGradle,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const { loadLocalModelConfig } = require('../scripts/lib/localModelConfig');

const MODEL_META = loadLocalModelConfig();
const PACK_NAME = MODEL_META.assetPackName;
const MODEL_FILE = MODEL_META.fileName;
const DELIVERY_TYPE = MODEL_META.deliveryType;
const SOURCE_MODEL_DIR = 'assets/ai-model';

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

function withAssetPackGradle(config) {
  config = withSettingsGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(`:${PACK_NAME}`)) {
      cfg.modResults.contents += `\ninclude ':${PACK_NAME}'\n`;
    }
    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes('assetPacks')) {
      // Groovy DSL commonly used by Expo prebuild.
      if (contents.includes('android {')) {
        contents = contents.replace(
          /android\s*\{/,
          `android {\n    assetPacks = [":${PACK_NAME}"]`,
        );
      }
    }

    if (!contents.includes('noCompress') || !contents.includes('gguf')) {
      if (contents.includes('aaptOptions')) {
        contents = contents.replace(
          /aaptOptions\s*\{/,
          `aaptOptions {\n        noCompress 'gguf'`,
        );
      } else if (contents.includes('android {')) {
        contents = contents.replace(
          /android\s*\{/,
          `android {\n    aaptOptions {\n        noCompress 'gguf'\n    }`,
        );
      }
    }

    // Play Asset Delivery — install-time pack (no runtime AssetPackManager path needed).
    if (contents.includes('com.google.android.play:asset-delivery')) {
      contents = contents.replace(
        /\n\s*implementation "com\.google\.android\.play:asset-delivery:[^"]+"\n/,
        '\n',
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
}

function withAssetPackFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, 'android');
      const packRoot = path.join(androidRoot, PACK_NAME);
      const assetsDir = path.join(packRoot, 'src', 'main', 'assets');
      ensureDir(assetsDir);

      writeFileIfChanged(
        path.join(packRoot, 'build.gradle'),
        `plugins {
    id 'com.android.asset-pack'
}

assetPack {
    packName = "${PACK_NAME}"
    dynamicDelivery {
        deliveryType = "${DELIVERY_TYPE}"
    }
}
`,
      );

      // Copy model if the developer has placed one; otherwise leave a placeholder note.
      const sourceModel = path.join(projectRoot, SOURCE_MODEL_DIR, MODEL_FILE);
      const destModel = path.join(assetsDir, MODEL_FILE);
      const isProductionBuild =
        process.env.OPPUNA_PRODUCTION_BUILD === '1' ||
        process.env.EAS_BUILD_PROFILE === 'production';
      if (fs.existsSync(sourceModel)) {
        fs.copyFileSync(sourceModel, destModel);
      } else if (isProductionBuild) {
        throw new Error(
          `[oppuna] Production build requires ${SOURCE_MODEL_DIR}/${MODEL_FILE}. ` +
            'Place the Qwen GGUF (assets/ai-model/model.gguf) before building a production AAB.',
        );
      } else {
        writeFileIfChanged(
          path.join(assetsDir, 'README.txt'),
          `Place ${MODEL_FILE} in ${SOURCE_MODEL_DIR}/ before building a production AAB.\n` +
            `This install-time Play Asset Delivery pack ships the on-device LLM with Oppuna.\n` +
            `Do not commit the GGUF binary to git.\n`,
        );
      }

      // Native module sources
      const javaPackagePath = path.join(
        androidRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'oppuna',
        'care',
      );
      ensureDir(javaPackagePath);

      const nativeModuleSrc = path.join(
        projectRoot,
        'plugins',
        'native',
        'OppunaModelAssetModule.kt',
      );
      if (!fs.existsSync(nativeModuleSrc)) {
        throw new Error(`Missing native module source: ${nativeModuleSrc}`);
      }
      fs.copyFileSync(nativeModuleSrc, path.join(javaPackagePath, 'OppunaModelAssetModule.kt'));

      writeFileIfChanged(
        path.join(javaPackagePath, 'OppunaModelAssetPackage.kt'),
        `package com.oppuna.care

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class OppunaModelAssetPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(OppunaModelAssetModule(reactContext))
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
}

function withNativePackageRegistration(config) {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes('OppunaModelAssetPackage')) {
      // Kotlin MainApplication (Expo SDK 50+)
      if (contents.includes('PackageList(this).packages.apply')) {
        contents = contents.replace(
          /PackageList\(this\)\.packages\.apply\s*\{/,
          `PackageList(this).packages.apply {\n              add(OppunaModelAssetPackage())`,
        );
      } else if (contents.includes('packages.apply')) {
        contents = contents.replace(
          /packages\.apply\s*\{/,
          `packages.apply {\n              add(OppunaModelAssetPackage())`,
        );
      } else if (contents.includes('getPackages():')) {
        // Older Java style
        contents = contents.replace(
          /return\s+packages;/,
          `packages.add(new OppunaModelAssetPackage());\n            return packages;`,
        );
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withAiModelAssetPack(config) {
  config = withAssetPackGradle(config);
  config = withAssetPackFiles(config);
  config = withNativePackageRegistration(config);
  return config;
}

module.exports = createRunOncePlugin(
  withAiModelAssetPack,
  'oppuna-ai-model-asset-pack',
  '1.0.0',
);
