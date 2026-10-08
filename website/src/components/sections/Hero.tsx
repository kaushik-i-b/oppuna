import Link from "next/link";
import { ArrowRight } from "lucide-react";

const credibility = [
  "Agents",
  "RAG",
  "Automation",
  "Voice AI",
  "Document Intelligence",
  "Custom AI Products",
];

export function Hero() {
  return (
    <section
      className="site-backdrop relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <span
              className="size-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
            Oppuna Labs · AI product engineering
          </p>
          <h1
            id="hero-heading"
            className="mt-6 font-display text-[clamp(2.6rem,7vw,4.75rem)] font-semibold leading-[1.02] tracking-tight"
          >
            AI systems that solve real business problems.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            Oppuna Labs designs and builds production-grade AI agents,
            intelligent automation, enterprise knowledge systems and custom AI
            products.
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            We work from problem definition through architecture,
            implementation, integration and production deployment.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-black transition-colors hover:bg-white"
            >
              Discuss a Project
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/#solutions"
              className="inline-flex items-center justify-center rounded-full border border-line px-7 py-3.5 text-base font-semibold transition-colors hover:border-accent/60 hover:bg-accent/10"
            >
              Explore Our Capabilities
            </Link>
          </div>

          <p
            className="mt-10 flex flex-wrap gap-x-3 gap-y-2 text-sm font-medium text-muted"
            aria-label="Capabilities: Agents, RAG, Automation, Voice AI, Document Intelligence, Custom AI Products"
          >
            {credibility.map((item, i) => (
              <span key={item} className="inline-flex items-center gap-3">
                <span>{item}</span>
                {i < credibility.length - 1 ? (
                  <span className="text-accent/60" aria-hidden="true">
                    ·
                  </span>
                ) : null}
              </span>
            ))}
          </p>
        </div>

        <dl className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[
            {
              term: "Problem first",
              detail:
                "We start from the workflow and the measurable outcome — not the model.",
            },
            {
              term: "Systems, not demos",
              detail:
                "Agents wired into your tools, data and approvals, built to run in production.",
            },
            {
              term: "Shipped products",
              detail:
                "We build and operate our own AI products, not just client prototypes.",
            },
          ].map((item) => (
            <div key={item.term} className="bg-surface px-6 py-5">
              <dt className="font-semibold">{item.term}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
