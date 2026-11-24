import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/config/site";

type PageImage = {
  path: string;
  width: number;
  height: number;
  alt: string;
};

const defaultImage: PageImage = {
  path: "/og.png",
  width: 1200,
  height: 630,
  alt: "Oppuna Labs — AI systems that solve real business problems.",
};

type PageMetadataInput = {
  /** Full document title; the root template is not applied. */
  title: string;
  description: string;
  /** Site-root path, e.g. "/privacy". */
  path: string;
  image?: PageImage;
  type?: "website" | "article";
  noindex?: boolean;
};

/**
 * Complete per-page metadata.
 *
 * Next.js replaces (does not merge) nested objects such as `openGraph` and
 * `twitter` from parent layouts, so every page must set all of them or it
 * inherits the homepage's title, URL and image.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = defaultImage,
  type = "website",
  noindex = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image.path);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: "en_IN",
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: image.width,
          height: image.height,
          alt: image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: imageUrl, alt: image.alt }],
    },
    ...(noindex
      ? {
          robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
          },
        }
      : {}),
  };
}
