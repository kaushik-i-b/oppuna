import type { Metadata } from "next";
import { ProfessionalCategoryCard } from "@/components/directory/ProfessionalCategoryCard";
import { ProfessionalDirectory } from "@/components/directory/ProfessionalDirectory";
import { directoryCopy } from "@/content/directory";
import { absoluteUrl, siteConfig } from "@/config/site";

const title = "Find Mental Health Professionals | Oppuna";
const description =
  "Explore Oppuna's upcoming mental health professional directory, including psychiatrists, clinical psychologists, and counselling psychologists.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: absoluteUrl("/professionals") },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/professionals"),
    siteName: siteConfig.name,
    images: [
      {
        url: absoluteUrl("/og.png"),
        width: 1200,
        height: 630,
        alt: "Oppuna professional directory preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [absoluteUrl("/og.png")],
  },
  robots: { index: true, follow: true },
};

const categoryCards = [
  directoryCopy.categories.psychiatrist,
  directoryCopy.categories["clinical-psychologist"],
  directoryCopy.categories["counselling-psychologist"],
] as const;

export default function ProfessionalsPage() {
  return (
    <article>
      <header className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <p className="eyebrow">{directoryCopy.previewLabel}</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.3rem,6vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.045em]">
            {directoryCopy.pageHeading}
          </h1>
          <p className="mt-5 text-xl font-medium tracking-[-0.03em] text-foreground">
            {directoryCopy.heroTitle}
          </p>
          <div className="mt-5 max-w-2xl space-y-4 text-lg leading-relaxed text-muted">
            <p>{directoryCopy.subtitle}</p>
            <p>{directoryCopy.heroDescription}</p>
            <p>{directoryCopy.heroSecondary}</p>
            <p>{directoryCopy.positioning}</p>
          </div>
        </div>
      </header>

      <section
        className="border-t border-line"
        aria-labelledby="professional-categories-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 id="professional-categories-heading" className="section-title">
            {directoryCopy.categoriesHeading}
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
            {directoryCopy.categoriesIntro}
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {categoryCards.map((card) => (
              <li key={card.title} className="min-w-0">
                <ProfessionalCategoryCard
                  title={card.title}
                  description={card.summary}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-t border-line bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]"
        aria-labelledby="directory-results-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 id="directory-results-heading" className="sr-only">
            Demonstration profiles
          </h2>
          <ProfessionalDirectory />
          <aside className="mt-10 max-w-3xl space-y-3 text-sm leading-relaxed text-muted" role="note">
            <p>{directoryCopy.disclaimer}</p>
            <p>
              {directoryCopy.indiaResourcesLead}{" "}
              <a className="link" href="tel:112">
                112
              </a>
              , Tele-MANAS{" "}
              <a className="link" href="tel:14416">
                14416
              </a>{" "}
              and{" "}
              <a className="link" href="tel:18008914416">
                1800-89-14416
              </a>
              . Sources:{" "}
              <a
                className="link"
                href={siteConfig.officialSources.emergency112}
                target="_blank"
                rel="noopener noreferrer"
              >
                112.gov.in
              </a>{" "}
              and{" "}
              <a
                className="link"
                href={siteConfig.officialSources.teleManasProgramme}
                target="_blank"
                rel="noopener noreferrer"
              >
                MoHFW / DGHS
              </a>
              .
            </p>
            <p>{directoryCopy.privacyNote}</p>
            <p>{directoryCopy.noAvailability}</p>
          </aside>
        </div>
      </section>
    </article>
  );
}
