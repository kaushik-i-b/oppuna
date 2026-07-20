/**
 * Expo config plugin: Google Play Asset Delivery (install-time) for the GGUF model.
 *
 * During `npx expo prebuild`, this plugin:
 * 1. Creates `android/ai_model_asset_pack/` with install-time delivery
 * 2. Wires the asset pack into Gradle
 * 3. Injects a small native module (`OppunaModelAsset`) that resolves a
 *    filesystem path llama.rn can open via AssetPackManager
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

const PACK_NAME = 'ai_model_asset_pack';
const MODEL_FILE = 'model.gguf';
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

    // Play Asset Delivery dependency for AssetPackManager.
    if (!contents.includes('com.google.android.play:asset-delivery')) {
      if (contents.includes('dependencies {')) {
        contents = contents.replace(
          /dependencies\s*\{/,
          `dependencies {\n    implementation "com.google.android.play:asset-delivery:2.3.0"`,
        );
      }
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
        deliveryType = "install-time"
    }
}
`,
      );

      // Copy model if the developer has placed one; otherwise leave a placeholder note.
      const sourceModel = path.join(projectRoot, SOURCE_MODEL_DIR, MODEL_FILE);
      const destModel = path.join(assetsDir, MODEL_FILE);
      if (fs.existsSync(sourceModel)) {
        fs.copyFileSync(sourceModel, destModel);
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
        'app',
      );
      ensureDir(javaPackagePath);

      writeFileIfChanged(
        path.join(javaPackagePath, 'OppunaModelAssetModule.kt'),
        `package com.oppuna.app

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.assetpacks.AssetPackManagerFactory
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

class OppunaModelAssetModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "OppunaModelAsset"

  @ReactMethod
  fun getInstalledModelPath(packName: String, fileName: String, promise: Promise) {
    try {
      val manager = AssetPackManagerFactory.getInstance(reactContext)
      val location = manager.getPackLocation(packName)
      if (location != null) {
        val path = File(location.assetsPath(), fileName)
        if (path.exists()) {
          promise.resolve(path.absolutePath)
          return
        }
      }

      // Fallback: install-time packs are also visible via AssetManager for small assets,
      // but GGUF must be a real filesystem path for llama.cpp mmap. Try known PAD roots.
      val candidates = listOf(
        File(reactContext.filesDir, "../${'$'}packName/${'$'}fileName"),
        File("/data/data/" + reactContext.packageName + "/assets/${'$'}fileName")
      )
      for (candidate in candidates) {
        try {
          val normalized = candidate.canonicalFile
          if (normalized.exists()) {
            promise.resolve(normalized.absolutePath)
            return
          }
        } catch (_: Exception) {
        }
      }

      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("MODEL_PATH_ERROR", error.message, error)
    }
  }

  @ReactMethod
  fun sha256File(path: String, promise: Promise) {
    try {
      val digest = MessageDigest.getInstance("SHA-256")
      FileInputStream(File(path)).use { input ->
        val buffer = ByteArray(1024 * 1024)
        while (true) {
          val read = input.read(buffer)
          if (read <= 0) break
          digest.update(buffer, 0, read)
        }
      }
      val hex = digest.digest().joinToString("") { "%02x".format(it) }
      promise.resolve(hex)
    } catch (error: Exception) {
      promise.reject("SHA256_ERROR", error.message, error)
    }
  }
}
`,
      );

      writeFileIfChanged(
        path.join(javaPackagePath, 'OppunaModelAssetPackage.kt'),
        `package com.oppuna.app

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
