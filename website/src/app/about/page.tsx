import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About Oppuna and Winfin Technologies",
  description:
    "Oppuna is a privacy-first AI mental wellness companion developed by Winfin Technologies Private Limited. Learn about the mission, vision, and company.",
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: {
    title: "About Oppuna and Winfin Technologies",
    description:
      "Oppuna is a privacy-first AI mental wellness companion developed by Winfin Technologies Private Limited.",
    url: absoluteUrl("/about"),
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <article>
      <header className="relative overflow-hidden">
        <div
          className="hero-glow pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="eyebrow">About</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.2rem,5.5vw,3.8rem)] font-medium leading-[1.06] tracking-[-0.04em]">
            {siteConfig.winfin.relationshipLine}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {siteConfig.winfin.productStatement}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8 md:pb-24">
        <section aria-labelledby="about-oppuna-heading">
          <h2 id="about-oppuna-heading" className="section-title">
            About Oppuna
          </h2>
          <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-muted">
            <p>
              Oppuna is a privacy-first, AI-powered mental wellness companion
              designed to make everyday emotional support more accessible.
            </p>
            <p>
              Built around on-device artificial intelligence, Oppuna
              prioritizes privacy, accessibility, multilingual interaction,
              and responsible AI.
            </p>
            <p>
              The platform is designed to support emotional wellbeing through
              conversational assistance, mood reflection, and self-help
              experiences.
            </p>
          </div>
        </section>

        <section
          aria-label="Mission and vision"
          className="mt-14 grid gap-4 md:grid-cols-2"
        >
          <div className="card h-full">
            <h2 id="mission-heading" className="text-2xl font-medium tracking-[-0.03em]">
              Our Mission
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              “To make mental wellness support accessible, private, inclusive,
              and available whenever people need everyday emotional support.”
            </p>
          </div>
          <div className="card h-full">
            <h2 id="vision-heading" className="text-2xl font-medium tracking-[-0.03em]">
              Our Vision
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              “A future where technology reduces barriers to mental wellness
              support while respecting human dignity, privacy, and personal
              autonomy.”
            </p>
          </div>
        </section>

        <section
          aria-labelledby="about-winfin-heading"
          className="mt-14 border-t border-line pt-10"
        >
          <h2 id="about-winfin-heading" className="section-title">
            About Winfin Technologies
          </h2>
          <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-muted">
            <p>
              Winfin Technologies Private Limited is an Indian technology
              company developing digital products and software solutions.
            </p>
            <p>
              Oppuna is one of its mental wellness technology initiatives,
              combining privacy-focused engineering with responsible
              artificial intelligence.
            </p>
          </div>

          <div className="card mt-8 max-w-3xl">
            <h3 className="font-medium">Corporate Information</h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  Company
                </dt>
                <dd className="mt-1">{siteConfig.winfin.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  CIN
                </dt>
                <dd className="mt-1 font-mono">{siteConfig.winfin.cin}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  Location
                </dt>
                <dd className="mt-1">{siteConfig.winfin.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  Website
                </dt>
                <dd className="mt-1">
                  <a className="link" href={absoluteUrl("/")}>
                    https://oppuna.com
                  </a>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Corporate details should be verified against official records
              before publication. Only verified company information is shown
              here.
            </p>
          </div>
        </section>

        <section aria-labelledby="explore-heading" className="mt-14">
          <h2 id="explore-heading" className="text-2xl font-medium tracking-[-0.03em]">
            Explore Oppuna
          </h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link className="btn btn-primary" href="/professionals">
              Find Professionals
            </Link>
            <Link className="btn btn-secondary" href="/oppuna">
              Explore the Oppuna App
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
