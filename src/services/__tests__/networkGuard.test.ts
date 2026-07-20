import { isModelDownloadHost, isModelDownloadUrl } from '@/services/networkGuard';
import { LLAMA_MODEL, MODEL_DOWNLOAD_HOSTS } from '@/constants/app';

describe('networkGuard model-download allowlist', () => {
  it('allows the configured model hosts and their subdomains', () => {
    for (const host of MODEL_DOWNLOAD_HOSTS) {
      expect(isModelDownloadHost(host)).toBe(true);
    }
    expect(isModelDownloadHost('cdn-lfs.huggingface.co')).toBe(true);
    expect(isModelDownloadHost('some-shard.cdn-lfs.huggingface.co')).toBe(true);
  });

  it('rejects hosts outside the allowlist', () => {
    expect(isModelDownloadHost('example.com')).toBe(false);
    expect(isModelDownloadHost('evil-huggingface.co')).toBe(false);
    expect(isModelDownloadHost('huggingface.co.evil.com')).toBe(false);
  });

  it('only permits the model download over https', () => {
    expect(isModelDownloadUrl(LLAMA_MODEL.downloadUrl)).toBe(true);
    expect(isModelDownloadUrl('http://huggingface.co/model.gguf')).toBe(false);
    expect(isModelDownloadUrl('https://example.com/model.gguf')).toBe(false);
    expect(isModelDownloadUrl('file:///models/model.gguf')).toBe(false);
  });
});
