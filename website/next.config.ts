import path from "path";
import type { NextConfig } from "next";

/**
 * Prefer NEXT_PUBLIC_BASE_PATH. Fall back to GITHUB_PAGES=true → /{repo}.
 * Local / custom domain: leave unset (empty base path).
 */
function resolveBasePath(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_PATH;
  if (fromEnv !== undefined) {
    if (!fromEnv || fromEnv === "/") return "";
    const normalized = fromEnv.startsWith("/") ? fromEnv : `/${fromEnv}`;
    return normalized.replace(/\/$/, "");
  }
  if (process.env.GITHUB_PAGES === "true") {
    const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "oppuna";
    return `/${repo}`;
  }
  return "";
}

const basePath = resolveBasePath();

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
    // Ensure client + server bundles see the same values at build time.
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ||
      (basePath
        ? `https://kaushik-i-b.github.io${basePath}`
        : "http://localhost:3000"),
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
