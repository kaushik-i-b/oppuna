import { absoluteUrl, assetUrl, basePath, siteUrl } from "@/config/paths";

export { absoluteUrl, assetUrl, basePath, siteUrl };

/**
 * Central marketing configuration for Oppuna Labs.
 *
 * Oppuna Labs is an AI product engineering company. The team also designs
 * and ships its own consumer AI product, Oppuna (private AI-powered mental
 * wellness and journaling for Android) — referenced as engineering proof,
 * without fabricated metrics.
 *
 * Paths/URLs that depend on hosting come from NEXT_PUBLIC_* via paths.ts.
 */

export const siteConfig = {
  name: "Oppuna Labs",
  shortName: "Oppuna Labs",
  tagline: "AI systems that solve real business problems.",
  description:
    "Oppuna Labs designs and builds production-grade AI agents, enterprise RAG systems, intelligent automation, document AI, voice AI and custom AI products.",
  longDescription:
    "Oppuna Labs is an AI product engineering company. We take a business problem and design, build and deploy the AI system that solves it — agents, agentic workflow automation, enterprise knowledge systems, document intelligence, voice AI and custom AI products, taken from problem definition through architecture, implementation, integration and production deployment.",

  /** Existing shipped consumer AI product (engineering proof). */
  product: {
    name: "Oppuna",
    tagline: "Private AI-powered mental wellness and journaling.",
    description:
      "Oppuna combines private AI-powered journaling, guided reflection and wellness workflows in a consumer application designed with privacy and responsible AI considerations.",
    packageName: "com.oppuna.care",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=com.oppuna.care",
  },

  /** Live Google Play listing for the Oppuna product */
  googlePlayUrl:
    "https://play.google.com/store/apps/details?id=com.oppuna.care",
  packageName: "com.oppuna.care",

  /** Public contact */
  supportEmail: "support@oppuna.com",

  githubUrl: "https://github.com/kaushik-i-b",
  companyName: "Oppuna Labs",

  /** Canonical site URL (from NEXT_PUBLIC_SITE_URL). */
  siteUrl,

  social: {
    twitter: null as string | null,
    instagram: null as string | null,
    linkedin: null as string | null,
    github: "https://github.com/kaushik-i-b",
  },

  legal: {
    privacyPath: "/privacy",
    termsPath: "/terms",
    supportPath: "/support",
    lastUpdated: "8 October 2026",
  },

  nav: [
    { href: "/#solutions", label: "Solutions" },
    { href: "/#how-we-work", label: "How We Work" },
    { href: "/#products", label: "Products" },
    { href: "/#engineering", label: "Engineering" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

export function getGooglePlayHref(): string {
  return siteConfig.googlePlayUrl;
}

export function isGooglePlayLive(): boolean {
  return Boolean(siteConfig.googlePlayUrl);
}
