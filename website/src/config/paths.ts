/**
 * GitHub Pages / local / custom-domain path helpers.
 *
 * Set at build time:
 * - NEXT_PUBLIC_BASE_PATH=/oppuna  (empty for local or custom domain)
 * - NEXT_PUBLIC_SITE_URL=https://kaushik-i-b.github.io/oppuna
 *
 * next.config.ts also reads NEXT_PUBLIC_BASE_PATH for Next.js `basePath`,
 * so next/image and next/link auto-prefix app routes. Use `assetUrl` /
 * `absoluteUrl` for metadata, JSON-LD, and any raw href/src that would
 * otherwise bypass that prefix (especially paths starting with `/`).
 */

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === "/") return "";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.replace(/\/$/, "");
}

function normalizeSiteUrl(value: string | undefined): string {
  const fallback = "http://localhost:3000";
  return (value || fallback).replace(/\/$/, "");
}

/** Project base path, e.g. `/oppuna` on GitHub Pages, else `""`. */
export const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** Canonical origin + base path, no trailing slash. */
export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (basePath ? `https://kaushik-i-b.github.io${basePath}` : undefined),
);

/**
 * Prefix a site-root path with the configured base path.
 * Example: assetUrl("/brand/icon.png") → "/oppuna/brand/icon.png" on Pages.
 */
export function assetUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

/**
 * Absolute URL for canonicals, Open Graph, JSON-LD, etc.
 * Uses string join so `/brand/...` stays under the site path
 * (unlike `new URL("/brand/...", siteUrl)`, which jumps to the origin root).
 */
export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return siteUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

/**
 * Path for next/image and next/link.
 * Next.js already applies `basePath` from next.config — do not double-prefix.
 */
export function appPath(path: string): string {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}
