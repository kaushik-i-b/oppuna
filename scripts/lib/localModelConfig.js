/**
 * Shared machine-readable model metadata loader.
 * Single source of truth: config/local-model.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'local-model.json');

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
  return {
    modelId: raw.modelId,
    displayName: raw.displayName,
    fileName: raw.fileName,
    version: String(raw.version),
    expectedSize: raw.expectedSize,
    sha256: raw.sha256.toLowerCase(),
    deliveryType: raw.deliveryType,
    assetPackName: raw.assetPackName,
    minPlausibleSizeBytes: raw.minPlausibleSizeBytes ?? 1_000_000,
    sourceRepo: raw.sourceRepo,
    sourceFile: raw.sourceFile,
    packageId: raw.packageId ?? 'com.oppuna.app',
    storageHeadroomBytes: raw.storageHeadroomBytes ?? 150 * 1024 * 1024,
  };
}

/** Additional free bytes needed beyond the installed asset pack for one private copy. */
function requiredPrivateModelStorageBytes(expectedSize, headroomBytes) {
  return expectedSize + headroomBytes;
}

module.exports = {
  CONFIG_PATH,
  loadLocalModelConfig,
  requiredPrivateModelStorageBytes,
};
