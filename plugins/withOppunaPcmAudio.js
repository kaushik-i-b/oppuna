/**
 * Copies the Talk to Oppuna PCM microphone/speaker module into the Android project.
 */
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function copyIfChanged(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const next = fs.readFileSync(from);
  if (fs.existsSync(to) && fs.readFileSync(to).equals(next)) return;
  fs.writeFileSync(to, next);
}

function withVoiceTestCleartext(config) {
  if (!config.extra?.voiceTestApk) return config;
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) app.$['android:usesCleartextTraffic'] = 'true';
    return cfg;
  });
}

function withOppunaPcmAudio(config) {
  config = withVoiceTestCleartext(config);
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const destDir = path.join(
        cfg.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'oppuna',
        'care',
      );
      const sourceDir = path.join(cfg.modRequest.projectRoot, 'plugins', 'native');
      copyIfChanged(
        path.join(sourceDir, 'OppunaPcmAudioModule.kt'),
        path.join(destDir, 'OppunaPcmAudioModule.kt'),
      );
      copyIfChanged(
        path.join(sourceDir, 'OppunaPcmAudioPackage.kt'),
        path.join(destDir, 'OppunaPcmAudioPackage.kt'),
      );
      return cfg;
    },
  ]);

  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('OppunaPcmAudioPackage')) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        'PackageList(this).packages.apply {\n              add(OppunaPcmAudioPackage())',
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = createRunOncePlugin(withOppunaPcmAudio, 'oppuna-pcm-audio', '1.0.0');
