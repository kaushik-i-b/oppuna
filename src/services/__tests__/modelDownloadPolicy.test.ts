import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import {
  isAllowedModelDownloadHost,
  isPinnedModelDownloadUrl,
  modelDownloadPercent,
  pinnedModelDownloadUrl,
} from '@/services/modelDownloadPolicy';

describe('model download policy', () => {
  it('pins the Hugging Face resolve URL for the configured GGUF', () => {
    expect(pinnedModelDownloadUrl(LOCAL_MODEL_CONFIG.sourceRepo, LOCAL_MODEL_CONFIG.sourceFile)).toBe(
      LOCAL_MODEL_CONFIG.downloadUrl,
    );
    expect(LOCAL_MODEL_CONFIG.downloadUrl).toBe(
      'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    );
    expect(LOCAL_MODEL_CONFIG.deliveryType).toBe('on-demand');
    expect(isPinnedModelDownloadUrl(LOCAL_MODEL_CONFIG.downloadUrl)).toBe(true);
    expect(isPinnedModelDownloadUrl('https://example.com/model.gguf')).toBe(false);
  });

  it('allows only Hugging Face and its model CDN hosts', () => {
    expect(isAllowedModelDownloadHost('huggingface.co')).toBe(true);
    expect(isAllowedModelDownloadHost('cdn-lfs.huggingface.co')).toBe(true);
    expect(isAllowedModelDownloadHost('cdn-lfs-us-1.huggingface.co')).toBe(true);
    expect(isAllowedModelDownloadHost('cas-bridge.xethub.hf.co')).toBe(true);
    expect(isAllowedModelDownloadHost('huggingface.co.')).toBe(true);
  });

  it('rejects lookalike hosts', () => {
    expect(isAllowedModelDownloadHost('huggingface.co.evil.com')).toBe(false);
    expect(isAllowedModelDownloadHost('evilhuggingface.co')).toBe(false);
    expect(isAllowedModelDownloadHost('xethub.hf.co')).toBe(false);
    expect(isAllowedModelDownloadHost('example.com')).toBe(false);
    expect(isAllowedModelDownloadHost('')).toBe(false);
  });

  it('clamps download percent', () => {
    expect(modelDownloadPercent(0, 100)).toBe(0);
    expect(modelDownloadPercent(50, 100)).toBe(50);
    expect(modelDownloadPercent(150, 100)).toBe(100);
    expect(modelDownloadPercent(10, 0)).toBeNull();
  });
});
