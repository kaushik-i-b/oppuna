import Link from "next/link";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { GooglePlayButton } from "../GooglePlayButton";
import { PhoneMockup } from "../PhoneMockup";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "./SectionHeading";

const proof = [
  {
    title: "End-to-end product",
    body: "Designed, engineered and shipped as a complete application — not a prototype.",
  },
  {
    title: "On-device AI",
    body: "Real AI inference running locally on the device, with offline-first architecture.",
  },
  {
    title: "Privacy by design",
    body: "No mandatory account, local-first data, export and permanent delete built in.",
  },
];

export function Products() {
  return (
    <section
      id="products"
      aria-labelledby="products-heading"
      className="border-t border-line bg-surface/40"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <SectionHeading
          id="products-heading"
          eyebrow="Products"
          title="We build our own AI products too."
          lead="Oppuna Labs isn't only a services team. We design and ship complete AI products — and support them in the real world."
        />

        <div className="mt-10 grid items-center gap-10 overflow-hidden rounded-3xl border border-line bg-surface p-6 md:p-10 lg:grid-cols-[1fr_320px] lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              <Lock className="size-3.5" aria-hidden />
              Shipped product
            </p>
            <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Oppuna
            </h3>
            <p className="mt-2 text-lg text-muted">
              Private AI-powered mental wellness and journaling.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              Oppuna combines private AI-powered journaling, guided reflection
              and wellness workflows in a consumer application designed with
              privacy and responsible AI considerations. It is an example of
              the team taking an AI product from concept to a live application
              on Google Play.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {proof.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-line bg-white/[0.02] p-4"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-[0.83rem] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <GooglePlayButton>Explore Oppuna</GooglePlayButton>
              <Link
                href="/support"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-6 py-3 text-[0.95rem] font-semibold transition-colors hover:border-accent/60 hover:bg-accent/10"
              >
                Product support
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Live on Google Play ·{" "}
              <span className="font-mono text-[0.83rem]">
                {siteConfig.product.packageName}
              </span>
            </p>
          </div>
          <PhoneMockup className="lg:justify-self-end" />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Want a product like this for your business?{" "}
          <Link
            href="/#contact"
            className="inline-flex items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline"
          >
            Discuss your project
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
}
