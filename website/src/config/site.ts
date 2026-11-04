import { absoluteUrl, assetUrl, basePath, siteUrl } from "@/config/paths";

export { absoluteUrl, assetUrl, basePath, siteUrl };

/**
 * Marketing configuration.
 * Hosting URLs come from NEXT_PUBLIC_* via paths.ts.
 * Product facts below are verified against the app and Play listing.
 */

export const siteConfig = {
  name: "Oppuna Labs",
  productName: "Oppuna",
  shortName: "Oppuna Labs",
  tagline: "AI systems that solve real business problems.",
  description:
    "Oppuna Labs designs and builds production-grade AI agents, enterprise RAG systems, intelligent automation, document AI, voice AI and custom AI products.",
  longDescription:
    "Oppuna Labs designs and builds production-grade AI agents, intelligent automation, enterprise knowledge systems and custom AI products. Work runs from problem definition through architecture, implementation, integration and production deployment.",

  /** Store listing and on-device product. */
  productTagline: "Private AI-powered mental wellness and journaling.",
  productDescription:
    "Oppuna combines private AI-powered journaling, guided reflection and wellness workflows in a consumer application designed with privacy and responsible AI considerations.",
  packageName: "com.oppuna.care",
  androidPlatform: "Android" as const,
  version: "2.1.0",
  playStoreTitle: "Oppuna: AI Mood Journal",

  /** Live Google Play listing */
  googlePlayUrl:
    "https://play.google.com/store/apps/details?id=com.oppuna.care",

  /** Public support contact */
  supportEmail: "support@oppuna.com",

  githubUrl: "https://github.com/kaushik-i-b",

  founderName: "Kaushik Itagi",
  /** Legal publisher named on the Google Play listing. */
  companyName: "ADILAKSHMI INFOTECH PRIVATE LIMITED",

  /**
   * Company behind Oppuna, as described by the product owner.
   * Name, CIN, and Davanagere location match public company-registry
   * aggregators. The street address and directors are intentionally omitted.
   * This record is not described as a legal subsidiary.
   */
  winfin: {
    legalName: "Winfin Technologies Private Limited",
    cin: "U62099KA2025PTC201389",
    location: "Davanagere, Karnataka, India",
    website: "https://oppuna.com",
    productLine: "Oppuna — A Product of Winfin Technologies Private Limited",
    productStatement:
      "Oppuna is a product of Winfin Technologies Private Limited.",
    homepageStatement:
      "Oppuna is a privacy-first AI mental wellness platform developed by Winfin Technologies Private Limited.",
    copyright:
      "© 2026 Winfin Technologies Private Limited. All rights reserved.",
  },

  /** Canonical site URL (from NEXT_PUBLIC_SITE_URL). */
  siteUrl,

  productPath: "/oppuna",

  /** Confirmed UI languages in the Oppuna app. */
  languagesMention: [
    "English",
    "English (India)",
    "Hindi",
    "Kannada",
    "Spanish",
  ] as const,

  social: {
    twitter: null as string | null,
    instagram: null as string | null,
    linkedin: null as string | null,
  },

  legal: {
    privacyPath: "/privacy",
    termsPath: "/terms",
    supportPath: "/support",
    lastUpdated: "2 August 2026",
  },

  officialSources: {
    emergency112: "https://112.gov.in/",
    teleManasProgramme:
      "https://dghs.mohfw.gov.in/national-mental-health-programme.php",
    kiranHelplines: "https://depwd.gov.in/en/others-helplines/",
  },

  /**
   * India crisis resources for the Oppuna product page.
   * Tele-MANAS numbers confirmed via MoHFW / DGHS NMHP page (14416 and 1800-89-14416).
   * KIRAN: listed without a 24/7 claim pending separate verification.
   */
  crisisIndia: [
    {
      label: "Emergency services",
      phone: "112",
      display: "112",
      detail: "National emergency response",
      sourceUrl: "https://112.gov.in/",
      sourceLabel: "112.gov.in",
    },
    {
      label: "Tele-MANAS",
      phone: "14416",
      display: "14416",
      detail: "National 24/7 tele-mental-health service (short code)",
      sourceUrl:
        "https://dghs.mohfw.gov.in/national-mental-health-programme.php",
      sourceLabel: "MoHFW / DGHS",
    },
    {
      label: "Tele-MANAS (toll-free)",
      phone: "18008914416",
      display: "1800-89-14416",
      detail: "National 24/7 tele-mental-health service",
      sourceUrl:
        "https://dghs.mohfw.gov.in/national-mental-health-programme.php",
      sourceLabel: "MoHFW / DGHS",
    },
    {
      label: "KIRAN",
      phone: "18005990019",
      display: "1800-599-0019",
      detail: "Mental health support and rehabilitation",
      sourceUrl: "https://depwd.gov.in/en/others-helplines/",
      sourceLabel: "DEPwD helplines",
    },
  ],

  nav: [
    { href: "/#solutions", label: "Solutions" },
    { href: "/#how-we-work", label: "How We Work" },
    { href: "/#products", label: "Products" },
    { href: "/#engineering", label: "Engineering" },
    { href: "/about/", label: "About" },
    { href: "/professionals/", label: "Find Professionals" },
    { href: "/#contact", label: "Contact" },
  ],

  footerNav: [
    { href: "/about/", label: "About" },
    { href: "/professionals/", label: "Find Professionals" },
    { href: "/privacy/", label: "Privacy Policy" },
    { href: "/terms/", label: "Terms of Service" },
    { href: "/#contact", label: "Contact" },
    { href: "/#solutions", label: "Solutions" },
    { href: "/#products", label: "Products" },
    { href: "/oppuna/", label: "Oppuna" },
    { href: "/support/", label: "Support" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

export function getGooglePlayHref(): string {
  return siteConfig.googlePlayUrl;
}

export function isGooglePlayLive(): boolean {
  return Boolean(siteConfig.googlePlayUrl);
}
