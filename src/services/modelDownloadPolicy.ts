/**
 * Rules for the optional Qwen file download.
 *
 * The weights are not part of the initial install. Play on-demand delivery is
 * preferred. When that pack is not available, the native downloader may fetch
 * this exact Hugging Face file. Inference stays on device either way.
 */

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';

const PINNED_HOST = 'huggingface.co';

/** Redirect targets Hugging Face uses for large GGUF files. */
const REDIRECT_HOSTS = new Set([PINNED_HOST, 'cas-bridge.xethub.hf.co']);

export function pinnedModelDownloadUrl(sourceRepo: string, sourceFile: string): string {
  return `https://${PINNED_HOST}/${sourceRepo}/resolve/main/${sourceFile}`;
}

export function isPinnedModelDownloadUrl(url: string): boolean {
  return url === LOCAL_MODEL_CONFIG.downloadUrl;
}

/**
 * True for the pinned file host and the CDNs a redirect from that file may use.
 * `huggingface.co.evil.com` and other suffixes of a different registrable name
 * are rejected.
 */
export function isAllowedModelDownloadHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/\.$/, '');
  if (!normalized || normalized.includes('..') || normalized.includes('@')) return false;
  if (REDIRECT_HOSTS.has(normalized)) return true;
  return normalized.endsWith('.huggingface.co');
}

export function modelDownloadPercent(bytes: number, total: number): number | null {
  if (!Number.isFinite(bytes) || !Number.isFinite(total) || total <= 0) return null;
  const percent = Math.floor((bytes / total) * 100);
  if (!Number.isFinite(percent)) return null;
  return Math.max(0, Math.min(100, percent));
}
