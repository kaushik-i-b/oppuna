import { absoluteUrl, siteConfig } from "@/config/site";

export function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Oppuna Labs",
    url: absoluteUrl("/"),
    email: siteConfig.supportEmail,
    description: siteConfig.description,
    sameAs: [siteConfig.githubUrl],
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI agents, automation and AI product engineering",
          description: siteConfig.longDescription,
        },
      },
    ],
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Oppuna",
    applicationCategory: "HealthApplication",
    operatingSystem: "Android",
    description: siteConfig.product.description,
    url: absoluteUrl("/#products"),
    downloadUrl: siteConfig.product.googlePlayUrl,
    installUrl: siteConfig.product.googlePlayUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      availability: "https://schema.org/InStock",
      url: siteConfig.product.googlePlayUrl,
    },
    author: {
      "@type": "Organization",
      name: "Oppuna Labs",
      email: siteConfig.supportEmail,
      url: absoluteUrl("/"),
    },
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Oppuna Labs",
    url: absoluteUrl("/"),
    description: siteConfig.description,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([organization, software, webSite]),
      }}
    />
  );
}
