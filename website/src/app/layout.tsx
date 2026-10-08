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
    default: "Oppuna Labs | AI Agents, Automation & AI Product Engineering",
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Oppuna Labs",
    "AI agents",
    "agentic workflow automation",
    "enterprise RAG",
    "document intelligence",
    "voice AI",
    "LLM integration",
    "AI product engineering",
    "custom AI product development",
    "AI evaluation and guardrails",
  ],
  authors: [{ name: siteConfig.companyName }],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: "Oppuna Labs | AI Agents, Automation & AI Product Engineering",
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl("/brand/feature-image.png"),
        width: 1024,
        height: 500,
        alt: "Oppuna Labs — AI systems that solve real business problems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oppuna Labs | AI Agents, Automation & AI Product Engineering",
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
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-black"
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
