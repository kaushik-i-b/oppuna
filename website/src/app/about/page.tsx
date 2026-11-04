import type { Metadata } from "next";
import Link from "next/link";
import { CorporateInformation } from "@/components/corporate/CorporateInformation";
import { aboutCopy } from "@/content/about";
import { directoryCopy } from "@/content/directory";
import { absoluteUrl, siteConfig } from "@/config/site";

const title = "About Oppuna";
const description =
  "Oppuna is a privacy-first AI mental wellness companion developed by Winfin Technologies Private Limited.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/about"),
    images: [
      {
        url: absoluteUrl("/og.png"),
        width: 1200,
        height: 630,
        alt: "Oppuna, a product of Winfin Technologies Private Limited",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [absoluteUrl("/og.png")],
  },
};

export default function AboutPage() {
  return (
    <article>
      <header className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <p className="eyebrow">{aboutCopy.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.4rem,6vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.045em]">
            {aboutCopy.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {siteConfig.winfin.homepageStatement}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            {aboutCopy.positioning}
          </p>
        </div>
      </header>

      <section className="border-t border-line" aria-labelledby="about-oppuna-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <h2 id="about-oppuna-heading" className="section-title">
            {aboutCopy.aboutHeading}
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed text-muted">
            {aboutCopy.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-t border-line bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]"
        aria-labelledby="mission-heading"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-2">
          <article className="card h-full">
            <h2 id="mission-heading" className="text-2xl font-medium tracking-[-0.03em]">
              {aboutCopy.missionHeading}
            </h2>
            <blockquote className="mt-4 text-lg leading-relaxed text-muted">
              <p>“{aboutCopy.mission}”</p>
            </blockquote>
          </article>
          <article className="card h-full">
            <h2 className="text-2xl font-medium tracking-[-0.03em]">
              {aboutCopy.visionHeading}
            </h2>
            <blockquote className="mt-4 text-lg leading-relaxed text-muted">
              <p>“{aboutCopy.vision}”</p>
            </blockquote>
          </article>
        </div>
      </section>

      <section className="border-t border-line" aria-labelledby="winfin-heading">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-5 py-16 md:px-8 md:py-24">
          <div className="max-w-3xl">
            <h2 id="winfin-heading" className="section-title">
              {aboutCopy.winfinHeading}
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              {aboutCopy.winfin.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <CorporateInformation />
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            The Google Play listing for Oppuna is published by{" "}
            {siteConfig.companyName}.
          </p>
        </div>
      </section>

      <section className="border-t border-line" aria-labelledby="about-next-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 id="about-next-heading" className="text-3xl font-medium tracking-[-0.03em]">
            Continue
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            {directoryCopy.disclaimer}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="btn btn-primary" href="/oppuna">
              Explore Oppuna
            </Link>
            <Link className="btn btn-secondary" href="/professionals">
              {directoryCopy.exploreDirectory}
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
