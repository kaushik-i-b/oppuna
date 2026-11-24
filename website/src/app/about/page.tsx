import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CorporateInformation } from "@/components/corporate/CorporateInformation";
import { aboutCopy } from "@/content/about";
import { assetUrl, siteConfig } from "@/config/site";

const title = "About Oppuna";
const description =
  "Oppuna is a privacy-first AI mental wellness companion developed by Winfin Technologies Private Limited.";

export const metadata: Metadata = pageMetadata({
  title: `${title} | ${siteConfig.name}`,
  description,
  path: "/about",
  image: {
    path: "/brand/feature-image.png",
    width: 1024,
    height: 500,
    alt: "Oppuna, a product of Winfin Technologies Private Limited",
  },
});

export default function AboutPage() {
  return (
    <article>
      <header className="border-b border-line">
        <div className="wrap py-14 md:py-20">
          <p className="eyebrow">{aboutCopy.eyebrow}</p>
          <h1 className="mt-6 max-w-3xl text-[clamp(2.25rem,4.4vw,3.375rem)] leading-[1.08] tracking-[-0.02em]">
            A private mental wellness
            <br />
            product from Winfin Technologies
          </h1>
          <p className="lede mt-6">{siteConfig.winfin.homepageStatement}</p>
          <p className="mt-4 max-w-2xl text-muted">{aboutCopy.positioning}</p>
        </div>
      </header>

      <section className="border-b border-line" aria-labelledby="about-oppuna-heading">
        <div className="wrap grid gap-8 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <h2 id="about-oppuna-heading" className="section-title lg:col-span-4">
            {aboutCopy.aboutHeading}
          </h2>
          <div className="max-w-2xl space-y-4 text-muted lg:col-span-7 lg:col-start-6">
            {aboutCopy.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section-dark"
        aria-label="Mission and vision"
      >
        <div className="wrap grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="border-t-2 border-foreground pt-6">
            <h2 className="label-mono">{aboutCopy.missionHeading}</h2>
            <blockquote className="mt-4 font-display text-xl leading-snug md:text-2xl">
              <p>{aboutCopy.mission}</p>
            </blockquote>
          </div>
          <div className="border-t-2 border-foreground pt-6">
            <h2 className="label-mono">{aboutCopy.visionHeading}</h2>
            <blockquote className="mt-4 font-display text-xl leading-snug md:text-2xl">
              <p>{aboutCopy.vision}</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="border-b border-line" aria-labelledby="winfin-heading">
        <div className="wrap grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 id="winfin-heading" className="section-title">
              {aboutCopy.winfinHeading}
            </h2>
            <div className="mt-6 space-y-4 text-muted">
              {aboutCopy.winfin.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p>
                Oppuna Labs, the engineering-services practice, is also part
                of Winfin Technologies.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <CorporateInformation />
            <p className="mt-6 text-sm text-muted">
              The Google Play listing for Oppuna is published by{" "}
              {siteConfig.companyName}.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-next-heading">
        <div className="wrap grid gap-8 py-16 md:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 id="about-next-heading" className="section-title">
              Continue
            </h2>
            <p className="mt-4 max-w-2xl text-muted">{aboutCopy.disclaimer}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <Link className="btn btn-primary" href="/oppuna">
              Explore Oppuna
            </Link>
            <a className="btn btn-secondary" href={assetUrl("/#services")}>
              Oppuna Labs services
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
