import path from "path";
import type { NextConfig } from "next";

/**
 * Production (custom domain oppuna.com): NEXT_PUBLIC_BASE_PATH="" (empty)
 * Project Pages under /repo: set NEXT_PUBLIC_BASE_PATH=/oppuna explicitly
 * Local: unset → empty base path + localhost site URL
 */
function resolveBasePath(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_PATH;
  if (fromEnv !== undefined) {
    if (!fromEnv || fromEnv === "/") return "";
    const normalized = fromEnv.startsWith("/") ? fromEnv : `/${fromEnv}`;
    return normalized.replace(/\/$/, "");
  }
  return "";
}

const basePath = resolveBasePath();
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (basePath ? `https://kaushik-i-b.github.io${basePath}` : "https://oppuna.com");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl.replace(/\/$/, ""),
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
