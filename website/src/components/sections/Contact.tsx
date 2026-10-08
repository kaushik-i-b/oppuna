"use client";

import { ArrowRight, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { siteConfig } from "@/config/site";

const scopes = [
  "Proof of concept",
  "Production system",
  "Existing AI system improvement",
  "Not sure yet",
] as const;

const inputClass =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-[0.95rem] text-foreground placeholder:text-muted/70 transition-colors focus:border-accent/60 focus:outline-none";

export function Contact() {
  const [scope, setScope] = useState<(typeof scopes)[number]>("Not sure yet");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const details = String(data.get("details") ?? "").trim();

    const subject = `Project inquiry${company ? ` — ${company}` : ""}${name ? ` (${name})` : ""}`;
    const lines = [
      `Name: ${name || "—"}`,
      `Work email: ${email || "—"}`,
      `Company: ${company || "—"}`,
      `Approximate project scope: ${scope}`,
      "",
      "What are you trying to build or automate?",
      details || "—",
    ];
    const href = `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = href;
    setSent(true);
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="border-t border-line bg-surface/40"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="grid lg:grid-cols-[1fr_1.1fr]">
            <div className="relative flex flex-col justify-center p-7 md:p-10">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_10%,rgba(94,234,212,0.12),transparent_65%)]"
                aria-hidden="true"
              />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Engagement
                </p>
                <h2
                  id="contact-heading"
                  className="mt-3 font-display text-[clamp(1.9rem,4.5vw,2.75rem)] font-semibold leading-[1.08] tracking-tight"
                >
                  Have a business problem that AI could solve?
                </h2>
                <p className="mt-4 leading-relaxed text-muted">
                  Tell us about the workflow, bottleneck or product you want
                  to build.
                </p>
                <p className="mt-3 leading-relaxed text-muted">
                  We&apos;ll help determine whether AI is actually the right
                  solution — and if it is, how to take it into production.
                </p>
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="mt-7 inline-flex items-center gap-2.5 rounded-2xl border border-line bg-white/[0.02] px-5 py-4 transition-colors hover:border-accent/50"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Mail className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-[0.14em] text-muted">
                      Email us directly
                    </span>
                    <span className="block font-semibold text-accent">
                      {siteConfig.supportEmail}
                    </span>
                  </span>
                </a>
              </div>
            </div>

            <div className="border-t border-line p-7 md:p-10 lg:border-l lg:border-t-0">
              <h3 className="text-lg font-semibold tracking-tight">
                Discuss Your Project
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                This form opens your email app with everything pre-filled —
                nothing is sent anywhere automatically.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Work email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-company"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Company
                    </label>
                    <input
                      id="contact-company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      placeholder="Company Inc."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-details"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    What are you trying to build or automate?
                  </label>
                  <textarea
                    id="contact-details"
                    name="details"
                    rows={4}
                    placeholder="Describe the workflow, bottleneck or product idea…"
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <fieldset>
                  <legend className="mb-2 block text-sm font-medium">
                    Approximate project scope
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {scopes.map((option) => (
                      <label
                        key={option}
                        className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          scope === option
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-line text-muted hover:border-accent/40 hover:text-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name="scope"
                          value={option}
                          checked={scope === option}
                          onChange={() => setScope(option)}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-black transition-colors hover:bg-white sm:w-auto"
                >
                  Discuss Your Project
                  <ArrowRight className="size-4" aria-hidden />
                </button>
                {sent ? (
                  <p
                    className="text-sm text-muted"
                    role="status"
                    aria-live="polite"
                  >
                    Your email app should have opened with the message ready
                    to send. Prefer to write directly? Email{" "}
                    <a
                      href={`mailto:${siteConfig.supportEmail}`}
                      className="font-semibold text-accent underline-offset-4 hover:underline"
                    >
                      {siteConfig.supportEmail}
                    </a>
                    .
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
