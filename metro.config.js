const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

for (const ext of ['wasm', 'gguf', 'txt', 'md', 'wav', 'mp3']) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
}

// Prefer CJS / react-native entries so packages like zustand don't pull ESM
// builds that contain bare `import.meta` (breaks Metro web classic scripts).
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'default',
];

const LLAMA_RN_WEB_SHIM = path.resolve(__dirname, 'src/shims/llama.rn.web.ts');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // llama.rn touches TurboModules at import time — stub it on web.
  if (
    platform === 'web' &&
    (moduleName === 'llama.rn' || moduleName.startsWith('llama.rn/'))
  ) {
    return {
      type: 'sourceFile',
      filePath: LLAMA_RN_WEB_SHIM,
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
