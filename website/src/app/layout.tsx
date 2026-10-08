import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, siteConfig } from "@/config/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const pageTitle =
  "Oppuna Labs | AI Agents, Automation & AI Product Engineering";

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(`${siteConfig.siteUrl}/`),
  title: {
    default: pageTitle,
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
    "custom AI products",
  ],
  authors: [{ name: siteConfig.name }],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    locale: "en",
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: pageTitle,
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl("/og.png"),
        width: 1200,
        height: 630,
        alt: "Oppuna Labs — AI systems that solve real business problems.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: siteConfig.description,
    images: [absoluteUrl("/og.png")],
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
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
