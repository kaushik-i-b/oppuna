/** @jest-environment node */

const path = require('path');
const {
  loadLocalModelConfig,
  requiredPrivateModelStorageBytes,
} = require('../lib/localModelConfig');

describe('local-model.json source of truth', () => {
  it('reads expectedSize as 806058496 (not truncated to 806)', () => {
    const config = loadLocalModelConfig();
    expect(config.expectedSize).toBe(806058496);
    expect(String(config.expectedSize)).not.toBe('806');
  });

  it('exposes consistent release metadata', () => {
    const config = loadLocalModelConfig();
    expect(config.modelId).toBe('oppuna-gemma3-1b-it-q4km');
    expect(config.fileName).toBe('model.gguf');
    expect(config.deliveryType).toBe('install-time');
    expect(config.assetPackName).toBe('ai_model_asset_pack');
    expect(config.sha256).toMatch(/^[a-f0-9]{64}$/);
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
