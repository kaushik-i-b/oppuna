import { absoluteUrl, siteConfig } from "@/config/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Android",
    description: siteConfig.description,
    url: absoluteUrl("/"),
    image: absoluteUrl("/brand/icon.png"),
    downloadUrl: siteConfig.googlePlayUrl,
    installUrl: siteConfig.googlePlayUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    author: {
      "@type": "Organization",
      name: siteConfig.companyName,
      email: siteConfig.supportEmail,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
