const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite web imports a WASM module; Metro must treat .wasm as an asset.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// Allow optional bundled GGUF models for llama.rn-backed on-device generation.
if (!config.resolver.assetExts.includes('gguf')) {
  config.resolver.assetExts.push('gguf');
}

module.exports = config;
