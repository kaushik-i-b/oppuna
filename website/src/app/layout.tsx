import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, siteConfig } from "@/config/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Trailing slash keeps relative metadata paths under the site origin.
  metadataBase: new URL(`${siteConfig.siteUrl}/`),
  title: {
    default: `${siteConfig.playStoreTitle} — Private mood journal for Android`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Oppuna AI mood journal",
    "private mood tracker",
    "emotional wellness app",
    "anxiety journal",
    "gratitude journal",
    "breathing exercises",
    "grounding exercises",
    "on-device AI wellness",
    "privacy-first wellness",
    "Android wellness app India",
  ],
  authors: [{ name: siteConfig.companyName }],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: `${siteConfig.playStoreTitle} — ${siteConfig.tagline}`,
    description: siteConfig.longDescription,
    images: [
      {
        url: absoluteUrl("/brand/feature-image.png"),
        width: 1024,
        height: 500,
        alt: "Oppuna — private mood journal and on-device AI for Android",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.playStoreTitle} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [absoluteUrl("/brand/feature-image.png")],
  },
  icons: {
    icon: [
      { url: absoluteUrl("/favicon.svg"), type: "image/svg+xml" },
      {
        url: absoluteUrl("/brand/favicon.png"),
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [{ url: absoluteUrl("/brand/icon.png") }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${fraunces.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-sage focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <JsonLd />
      </body>
    </html>
  );
}
