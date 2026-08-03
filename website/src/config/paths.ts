/**
 * Hosting path helpers.
 *
 * Production (custom domain):
 * - NEXT_PUBLIC_BASE_PATH=   (empty)
 * - NEXT_PUBLIC_SITE_URL=https://oppuna.com
 *
 * Project Pages fallback (optional):
 * - NEXT_PUBLIC_BASE_PATH=/oppuna
 * - NEXT_PUBLIC_SITE_URL=https://kaushik-i-b.github.io/oppuna
 *
 * Use `assetUrl` / `absoluteUrl` for metadata, JSON-LD, and raw href/src.
 * `appPath` is for next/link / next/image when basePath is applied by Next.
 */

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === "/") return "";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.replace(/\/$/, "");
}

function normalizeSiteUrl(value: string | undefined): string {
  const fallback = "https://oppuna.com";
  return (value || fallback).replace(/\/$/, "");
}

/** Project base path — empty on oppuna.com / local custom-domain builds. */
export const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** Canonical origin, no trailing slash. */
export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/**
 * Prefix a site-root path with the configured base path.
 * On oppuna.com: assetUrl("/brand/icon.png") → "/brand/icon.png"
 */
export function assetUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

/**
 * Absolute URL for canonicals, Open Graph, JSON-LD, etc.
 * Page paths get a trailing slash (matches Next `trailingSlash: true`).
 * Asset paths (with a file extension) stay as-is.
 */
export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return `${siteUrl}/`;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isAsset = /\.[a-zA-Z0-9]+$/.test(normalizedPath);
  if (isAsset) return `${siteUrl}${normalizedPath}`;
  const withSlash = normalizedPath.endsWith("/")
    ? normalizedPath
    : `${normalizedPath}/`;
  return `${siteUrl}${withSlash}`;
}

/**
 * Path for next/image and next/link.
 * Next.js already applies `basePath` from next.config — do not double-prefix.
 */
export function appPath(path: string): string {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}
