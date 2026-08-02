import { absoluteUrl, assetUrl, basePath, siteUrl } from "@/config/paths";

export { absoluteUrl, assetUrl, basePath, siteUrl };

/**
 * Central marketing configuration.
 * Paths/URLs that depend on hosting come from NEXT_PUBLIC_* via paths.ts.
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

  /** Public support contact */
  supportEmail: "support@oppuna.com",

  founderName: "Kaushik Itagi",
  companyName: "ADILAKSHMI INFOTECH PRIVATE LIMITED",

  /** Canonical site URL (from NEXT_PUBLIC_SITE_URL). */
  siteUrl,

  /** Confirmed UI languages to mention on the marketing site. */
  languagesMention: ["English", "Hindi", "Spanish"] as const,

  social: {
    twitter: null as string | null,
    instagram: null as string | null,
    linkedin: null as string | null,
    /** Intentionally null — do not expose the public repository on the marketing site. */
    github: null as string | null,
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
   * India crisis resources for the marketing site.
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
