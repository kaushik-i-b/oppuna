/** @jest-environment node */

const path = require('path');
const {
  loadLocalModelConfig,
  requiredPrivateModelStorageBytes,
} = require('../lib/localModelConfig');

describe('local-model.json source of truth', () => {
  it('reads expectedSize as full byte count (not truncated)', () => {
    const config = loadLocalModelConfig();
    expect(config.expectedSize).toBe(986048768);
    expect(String(config.expectedSize)).not.toBe('986');
    expect(config.expectedSize).toBeLessThan(1073741824);
  });

  it('exposes consistent release metadata', () => {
    const config = loadLocalModelConfig();
    expect(config.modelId).toBe('oppuna-qwen25-1_5b-instruct-q4km');
    expect(config.fileName).toBe('model.gguf');
    expect(config.deliveryType).toBe('install-time');
    expect(config.assetPackName).toBe('ai_model_asset_pack');
    expect(config.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(config.sourceRepo).toBe('bartowski/Qwen2.5-1.5B-Instruct-GGUF');
  });

  it('calculates storage as expectedSize + headroom (not 2×)', () => {
    const config = loadLocalModelConfig();
    const required = requiredPrivateModelStorageBytes(
      config.expectedSize,
      config.storageHeadroomBytes,
    );
    expect(required).toBe(config.expectedSize + config.storageHeadroomBytes);
    expect(required).toBeLessThan(config.expectedSize * 2);
  });

  it('config file lives at the expected path', () => {
    expect(path.basename(require('../lib/localModelConfig').CONFIG_PATH)).toBe(
      'local-model.json',
    );
  });
});
