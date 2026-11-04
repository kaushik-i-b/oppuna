import type { Metadata } from "next";
import { DirectoryBrowser } from "@/components/professionals/DirectoryBrowser";
import { DirectoryDisclaimer } from "@/components/professionals/DirectoryDisclaimer";
import { absoluteUrl, siteConfig } from "@/config/site";
import { PROFESSIONALS } from "@/data/professionals";

export const metadata: Metadata = {
  title: "Find Mental Health Professionals | Oppuna",
  description:
    "Explore Oppuna's upcoming mental health professional directory, including psychiatrists, clinical psychologists, and counselling psychologists.",
  alternates: { canonical: absoluteUrl("/professionals") },
  openGraph: {
    title: "Find Mental Health Professionals | Oppuna",
    description:
      "Explore Oppuna's upcoming mental health professional directory, including psychiatrists, clinical psychologists, and counselling psychologists.",
    url: absoluteUrl("/professionals"),
    type: "website",
    images: [
      {
        url: absoluteUrl("/brand/feature-image.png"),
        width: 1024,
        height: 500,
        alt: "Oppuna — private mental wellness support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Mental Health Professionals | Oppuna",
    description:
      "Explore Oppuna's upcoming mental health professional directory, including psychiatrists, clinical psychologists, and counselling psychologists.",
  },
};

export default function ProfessionalsPage() {
  return (
    <article>
      <header className="relative overflow-hidden">
        <div
          className="hero-glow pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="eyebrow">Professional Directory Preview</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.2rem,5.5vw,3.8rem)] font-medium leading-[1.06] tracking-[-0.04em]">
            Find the Right Mental Health Professional
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Explore mental health professionals by specialization, language,
            and area of support.
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Oppuna is preparing a directory to help people discover qualified
            mental health professionals.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8 md:pb-24">
        <section aria-labelledby="directory-hero-heading" className="card">
          <h2 id="directory-hero-heading" className="text-2xl font-medium tracking-[-0.03em]">
            Professional Mental Health Support
          </h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-muted">
            Discover professionals specializing in emotional wellbeing,
            psychological support, and psychiatric care.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            Everyday AI-powered mental wellness support, with
            professional-care discovery planned for the future.
          </p>
        </section>

        <div className="mt-6">
          <DirectoryDisclaimer />
        </div>

        <section aria-label="Professional directory" className="mt-8">
          <DirectoryBrowser profiles={PROFESSIONALS} />
        </section>

        <section
          aria-labelledby="categories-heading"
          className="mt-14 border-t border-line pt-10"
        >
          <h2 id="categories-heading" className="section-title">
            Professional categories
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">
            These categories describe distinct qualifications and scopes of
            practice. They are not interchangeable. Provider qualifications,
            registration, and scope of practice must be verified before
            onboarding real professionals.
          </p>
          <dl className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="card h-full">
              <dt className="font-medium">Psychiatrists</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Medical doctors specializing in mental health assessment,
                diagnosis, and treatment, including medication management
                where clinically appropriate.
              </dd>
            </div>
            <div className="card h-full">
              <dt className="font-medium">Clinical Psychologists</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Qualified mental health professionals specializing in
                psychological assessment and evidence-based psychological
                interventions.
              </dd>
            </div>
            <div className="card h-full">
              <dt className="font-medium">Counselling Psychologists</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Professionals supporting emotional wellbeing, stress
                management, relationships, and life challenges within their
                qualifications and professional scope.
              </dd>
            </div>
          </dl>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
            Oppuna is a product of {siteConfig.winfin.name}. Questions about
            the directory go to{" "}
            <a
              className="link"
              href={`mailto:${siteConfig.supportEmail}`}
            >
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
