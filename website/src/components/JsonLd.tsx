import { absoluteUrl, siteConfig } from "@/config/site";

const organizationId = `${absoluteUrl("/")}#organization`;
const parentId = `${absoluteUrl("/about")}#winfin`;

function Script({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Site-wide: the Oppuna Labs organisation and the website. */
export function JsonLd() {
  const { winfin } = siteConfig;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        url: absoluteUrl("/"),
        email: siteConfig.supportEmail,
        description: siteConfig.description,
        logo: absoluteUrl("/labs-mark-512.png"),
        sameAs: [siteConfig.githubUrl],
        parentOrganization: { "@id": parentId },
      },
      {
        "@type": "Organization",
        "@id": parentId,
        name: winfin.legalName,
        legalName: winfin.legalName,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Davanagere",
          addressRegion: "Karnataka",
          addressCountry: "IN",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl("/")}#website`,
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        inLanguage: "en",
        publisher: { "@id": organizationId },
      },
    ],
  };

  return <Script data={data} />;
}

/** Oppuna app page only. */
export function ProductJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
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
    inLanguage: ["en", "hi", "kn", "es"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: siteConfig.googlePlayUrl,
    },
    author: { "@id": parentId },
    publisher: {
      "@type": "Organization",
      name: siteConfig.companyName,
      email: siteConfig.supportEmail,
    },
  };

  return <Script data={data} />;
}
