/**
 * Network guard — enforces Oppuna's offline-only promise.
 *
 * Any attempt to reach a remote host through `fetch` or `XMLHttpRequest` is
 * rejected. Local development traffic (Metro bundler, React DevTools, local
 * asset loading) is allowed so the app remains debuggable, but no production
 * code path is permitted to call the public internet.
 */

import { logger } from '@/utils/logger';

const LOCAL_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.0\.0\.1$/,
  /^0\.0\.0\.0$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^\[::1\]$/,
];

const ALLOWED_SCHEMES = ['file:', 'blob:', 'data:', 'content:', 'asset:'];

function isAllowed(rawUrl: string): boolean {
  if (!rawUrl) return true;

  const lower = rawUrl.toLowerCase();
  if (ALLOWED_SCHEMES.some((scheme) => lower.startsWith(scheme))) return true;

  // Relative URLs never hit the network in our bundle context.
  if (!/^https?:\/\//i.test(lower)) return true;

  try {
    const host = lower.replace(/^https?:\/\//, '').split(/[/?#]/)[0]?.split(':')[0] ?? '';
    if (__DEV__ && LOCAL_HOST_PATTERNS.some((re) => re.test(host))) return true;
  } catch {
    return false;
  }

  return false;
}

function blockedError(url: string): Error {
  logger.warn('Blocked outbound network request', { url });
  return new Error(
    'Oppuna is offline-only. Outbound network requests are blocked by design.',
  );
}

function installFetchGuard(): void {
  const globalAny = globalThis as unknown as { fetch?: typeof fetch };
  const originalFetch = globalAny.fetch;
  if (!originalFetch) return;

  globalAny.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    if (!isAllowed(url)) {
      return Promise.reject(blockedError(url));
    }
    return originalFetch(input as RequestInfo, init);
  }) as typeof fetch;
}

function installXhrGuard(): void {
  const XHR = (globalThis as unknown as { XMLHttpRequest?: typeof XMLHttpRequest })
    .XMLHttpRequest;
  if (!XHR) return;

  const originalOpen = XHR.prototype.open;
  XHR.prototype.open = function open(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    const target = typeof url === 'string' ? url : url.toString();
    if (!isAllowed(target)) {
      throw blockedError(target);
    }
    // @ts-expect-error - forwarding the original variadic signature.
    return originalOpen.call(this, method, url, ...rest);
  } as typeof XHR.prototype.open;
}

let installed = false;

export function installNetworkGuard(): void {
  if (installed) return;
  installed = true;
  installFetchGuard();
  installXhrGuard();
  logger.info('Network guard installed (offline-only mode)');
}

// Auto-install on import.
installNetworkGuard();
