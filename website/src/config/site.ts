/**
 * Central marketing configuration.
 * Replace PLACEHOLDER_* values before public launch.
 */

export const siteConfig = {
  name: "Oppuna",
  shortName: "Oppuna",
  tagline: "Private AI for your thoughts",
  description:
    "Oppuna is a private, offline emotional-wellness companion for Android. Journal, check in with your mood, follow a gentle daily plan, and talk with an on-device supportive companion—without an account or cloud sync.",
  longDescription:
    "A calm Android wellness app for everyday reflection, CBT-inspired journaling, mood check-ins, breathing, and on-device supportive guidance. Built for privacy in India and beyond—not a replacement for professional care.",

  packageName: "com.oppuna.care",
  androidPlatform: "Android" as const,
  version: "2.0.0",

  /** Live Google Play listing */
  googlePlayUrl:
    "https://play.google.com/store/apps/details?id=com.oppuna.care",

  /** From Google Play developer contact */
  supportEmail: "admin@adilakshmi.co",

  founderName: "Kaushik Itagi",
  companyName: "ADILAKSHMI INFOTECH PRIVATE LIMITED",

  /**
   * GitHub Pages project site (no trailing slash).
   * Custom domain: change this and clear basePath by deploying without GITHUB_PAGES.
   */
  siteUrl: "https://kaushik-i-b.github.io/oppuna",

  /** Previous root privacy page; marketing privacy now lives at /privacy/ */
  legacyPrivacyUrl: "https://kaushik-i-b.github.io/oppuna/privacy/",

  social: {
    twitter: null as string | null,
    instagram: null as string | null,
    linkedin: null as string | null,
    github: "https://github.com/kaushik-i-b/oppuna",
  },

  legal: {
    privacyPath: "/privacy",
    termsPath: "/terms",
    supportPath: "/support",
    lastUpdated: "2026",
    /** Play Store content rating */
    ageGuidance: "Everyone",
  },

  /**
   * India crisis resources verified against Government of India / MoHFW / MoSJE
   * (KIRAN 1800-599-0019; Tele-MANAS 14416; emergency 112).
   */
  crisisIndia: [
    {
      label: "Emergency (India)",
      phone: "112",
      detail: "National emergency number",
    },
    {
      label: "KIRAN Mental Health Helpline",
      phone: "18005990019",
      display: "1800-599-0019",
      detail: "Government of India, 24/7 toll-free",
    },
    {
      label: "Tele-MANAS",
      phone: "14416",
      display: "14416",
      detail: "National tele-mental health service, MoHFW, 24/7",
    },
  ],

  nav: [
    { href: "/#purpose", label: "Purpose" },
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#privacy", label: "Privacy" },
    { href: "/#faq", label: "FAQ" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

export function getGooglePlayHref(): string {
  return siteConfig.googlePlayUrl;
}

export function isGooglePlayLive(): boolean {
  return Boolean(siteConfig.googlePlayUrl);
}

export function absoluteUrl(path = "/"): string {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
