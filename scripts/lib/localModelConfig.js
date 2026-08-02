/**
 * Shared machine-readable model metadata loader.
 * Single source of truth: config/local-model.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'local-model.json');

const DEFAULT_STOP_SEQUENCES = [
  '<|im_end|>',
  '<|im_start|>',
  '<|endoftext|>',
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|EOT|>',
  '<|END_OF_TURN_TOKEN|>',
  '<|end_of_turn|>',
];

function loadLocalModelConfig() {
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (typeof raw.expectedSize !== 'number' || !Number.isFinite(raw.expectedSize)) {
    throw new Error('config/local-model.json: expectedSize must be a number');
  }
  if (raw.expectedSize < 1_000_000) {
    throw new Error(
      `config/local-model.json: expectedSize looks truncated (${raw.expectedSize})`,
    );
  }
  if (typeof raw.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(raw.sha256)) {
    throw new Error('config/local-model.json: sha256 must be a 64-char hex digest');
  }
  if (typeof raw.family !== 'string' || !raw.family.toLowerCase().includes('qwen')) {
    throw new Error('config/local-model.json: family must identify a Qwen-family model');
  }
  if (typeof raw.architecture !== 'string' || raw.architecture.length < 2) {
    throw new Error('config/local-model.json: architecture is required');
  }
  if (typeof raw.quantization !== 'string' || raw.quantization.length < 2) {
    throw new Error('config/local-model.json: quantization is required');
  }
  if (typeof raw.licenseId !== 'string' || raw.licenseId.length < 3) {
    throw new Error('config/local-model.json: licenseId is required');
  }
  if (raw.chatTemplate !== 'chatml') {
    throw new Error('config/local-model.json: chatTemplate must be "chatml" for Qwen2.5 Instruct');
  }

  const stopSequences = Array.isArray(raw.stopSequences)
    ? raw.stopSequences.filter((s) => typeof s === 'string' && s.length > 0)
    : DEFAULT_STOP_SEQUENCES;

  if (!stopSequences.includes('<|im_end|>')) {
    throw new Error('config/local-model.json: stopSequences must include <|im_end|>');
  }

  return {
    modelId: raw.modelId,
    displayName: raw.displayName,
    family: raw.family,
    architecture: raw.architecture,
    exactModel: raw.exactModel ?? raw.displayName,
    parameterCount: raw.parameterCount ?? null,
    quantization: raw.quantization,
    fileName: raw.fileName,
    version: String(raw.version),
    expectedSize: raw.expectedSize,
    sha256: raw.sha256.toLowerCase(),
    deliveryType: raw.deliveryType,
    assetPackName: raw.assetPackName,
    minPlausibleSizeBytes: raw.minPlausibleSizeBytes ?? 1_000_000,
    sourceRepo: raw.sourceRepo,
    sourceFile: raw.sourceFile,
    sourceUrl: raw.sourceUrl ?? null,
    packageId: raw.packageId ?? 'com.oppuna.care',
    storageHeadroomBytes: raw.storageHeadroomBytes ?? 150 * 1024 * 1024,
    licenseId: raw.licenseId,
    licenseName: raw.licenseName ?? 'Apache License, Version 2.0',
    chatTemplate: raw.chatTemplate,
    contextSize: typeof raw.contextSize === 'number' ? raw.contextSize : 4096,
    maxGenerationTokens:
      typeof raw.maxGenerationTokens === 'number' ? raw.maxGenerationTokens : 220,
    temperature: typeof raw.temperature === 'number' ? raw.temperature : 0.65,
    topP: typeof raw.topP === 'number' ? raw.topP : 0.9,
    responseTimeoutMs:
      typeof raw.responseTimeoutMs === 'number' ? raw.responseTimeoutMs : 60_000,
    initTimeoutMs: typeof raw.initTimeoutMs === 'number' ? raw.initTimeoutMs : 120_000,
    stopSequences,
  };
}

/** Additional free bytes needed beyond the installed asset pack for one private copy. */
function requiredPrivateModelStorageBytes(expectedSize, headroomBytes) {
  return expectedSize + headroomBytes;
}

module.exports = {
  CONFIG_PATH,
  DEFAULT_STOP_SEQUENCES,
  loadLocalModelConfig,
  requiredPrivateModelStorageBytes,
};
