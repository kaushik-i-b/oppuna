const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite web imports a WASM module; Metro must treat .wasm as an asset.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// On-device Llama models are GGUF files bundled as native assets.
if (!config.resolver.assetExts.includes('gguf')) {
  config.resolver.assetExts.push('gguf');
}

module.exports = config;
