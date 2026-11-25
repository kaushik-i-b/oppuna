import type { Metadata, Viewport } from "next";
import { Archivo, Source_Sans_3 } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, siteConfig } from "@/config/site";
import "./globals.css";

// next/font downloads these at build time and serves them from this site,
// so no request goes to Google Fonts at runtime.
const archivo = Archivo({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const pageTitle = siteConfig.homeTitle;

export const viewport: Viewport = {
  themeColor: "#fafafc",
  colorScheme: "light",
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
  creator: siteConfig.winfin.legalName,
  publisher: siteConfig.winfin.legalName,
  formatDetection: { email: false, address: false, telephone: false },
  // Site-wide defaults only. Canonical URLs, og:url and robots are set per
  // page (see src/lib/seo.ts) so pages such as the 404 do not inherit the
  // homepage's canonical URL or an "index" directive.
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    title: pageTitle,
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl("/og.png"),
        width: 1200,
        height: 630,
        alt: "Oppuna Labs: AI products built for real work.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${sourceSans.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-foreground focus:px-4 focus:py-3 focus:text-background"
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
