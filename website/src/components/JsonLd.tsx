import { absoluteUrl, siteConfig } from "@/config/site";

export function JsonLd() {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.playStoreTitle,
    alternateName: siteConfig.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Android",
    description: siteConfig.description,
    url: absoluteUrl("/"),
    image: absoluteUrl("/brand/icon.png"),
    downloadUrl: siteConfig.googlePlayUrl,
    installUrl: siteConfig.googlePlayUrl,
    softwareVersion: siteConfig.version,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: siteConfig.googlePlayUrl,
    },
    author: {
      "@type": "Organization",
      name: siteConfig.companyName,
      email: siteConfig.supportEmail,
      url: absoluteUrl("/"),
    },
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${siteConfig.playStoreTitle} — Private mood journal for Android`,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/"),
    },
    about: {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      operatingSystem: "Android",
      applicationCategory: "HealthApplication",
    },
  };

  const payload = [software, webPage];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
