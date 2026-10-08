import { absoluteUrl, siteConfig } from "@/config/site";

export function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    email: siteConfig.supportEmail,
    description: siteConfig.description,
    logo: absoluteUrl("/brand/icon.png"),
    sameAs: [siteConfig.githubUrl],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.productName,
    alternateName: siteConfig.playStoreTitle,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Android",
    description: siteConfig.productDescription,
    url: absoluteUrl("/oppuna"),
    image: absoluteUrl("/brand/feature-image.png"),
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
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([organization, website, software]),
      }}
    />
  );
}
