import type { Metadata } from "next";
import Link from "next/link";
import { GooglePlayButton } from "@/components/GooglePlayButton";
import { absoluteUrl, assetUrl, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Oppuna — private AI wellness",
  description: siteConfig.productDescription,
  alternates: { canonical: absoluteUrl("/oppuna") },
  openGraph: {
    title: "Oppuna — private AI wellness",
    description: siteConfig.productDescription,
    url: absoluteUrl("/oppuna"),
    images: [
      {
        url: absoluteUrl("/brand/feature-image.png"),
        width: 1024,
        height: 500,
        alt: "Oppuna — private mental wellness support",
      },
    ],
  },
};

const capabilities = [
  {
    title: "Daily wellness plan",
    body: "A personalized offline plan with activities and progress.",
  },
  {
    title: "Home hub",
    body: "Greeting, wellness score, streak, today’s plan, and a mood entry.",
  },
  {
    title: "Mood check-ins",
    body: "Mood, intensity, notes, and tags, with weekly insights.",
  },
  {
    title: "Journal",
    body: "Daily, gratitude, thought record, trigger, and note entries.",
  },
  {
    title: "On-device companion",
    body: "Supportive chat on the device, with a guided offline fallback.",
  },
  {
    title: "Voice mode",
    body: "Device text-to-speech and local microphone voice notes. Transcripts are not uploaded.",
  },
  {
    title: "Crisis safety",
    body: "Coaching pauses and local helpline resources are shown.",
  },
  {
    title: "Breathing, grounding, sleep",
    body: "Available through plan activities. Breathing is also available from the crisis flow.",
  },
  {
    title: "App lock",
    body: "Optional biometric or device PIN protection.",
  },
  {
    title: "Export and delete",
    body: "Export a JSON copy, or permanently erase app data.",
  },
  {
    title: "Offline architecture",
    body: "No account. A network guard is in place, and production Android builds block the INTERNET permission.",
  },
];

const steps = [
  {
    title: "Share how you are arriving",
    body: "During setup, optionally share your name, how you have been feeling, your goals, and how many minutes you have today.",
  },
  {
    title: "Understand privacy and consent",
    body: "Read how Oppuna keeps content on your device, then confirm the medical disclaimer before continuing.",
  },
  {
    title: "Follow a daily plan",
    body: "Open activities — journal, mood, breathing, grounding, sleep, or chat — at your own pace.",
  },
  {
    title: "Return and notice patterns",
    body: "Check in again and review insights without creating an account.",
  },
];

const faqs = [
  {
    q: "What is Oppuna?",
    a: "Oppuna is a private Android wellness companion for journaling, mood check-ins, a daily plan, breathing and grounding tools, and a supportive on-device companion. It is designed to work offline without an account.",
  },
  {
    q: "Is Oppuna a therapy or medical app?",
    a: "No. Oppuna is a wellness and self-help product. It does not diagnose, treat, or replace professional care, and it is not a medical device or emergency service.",
  },
  {
    q: "Which languages are available?",
    a: `The interface includes ${siteConfig.languagesMention.join(", ")}.`,
  },
  {
    q: "Does it work offline?",
    a: "Production builds are designed for airplane-mode use. Outbound internet access is blocked, and journals, moods, and preferences are stored on the device.",
  },
  {
    q: "How does the AI companion work?",
    a: "Conversational support can use a language model that runs on the device. If the model is unavailable, Oppuna still offers guided offline support. The app does not send chats to a cloud AI service for processing.",
  },
  {
    q: "Is Oppuna free?",
    a: "Oppuna is available on Google Play with no paid subscription or in-app purchase in the current app.",
  },
];

export default function OppunaProductPage() {
  return (
    <article>
      <header className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <p className="eyebrow">Product · Android</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.4rem,6vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.045em]">
            {siteConfig.productTagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {siteConfig.productDescription}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            Oppuna is the consumer product shipped by the Oppuna Labs team. It
            is a private wellness companion for everyday reflection, and it is
            not a therapist, a diagnostic system, or emergency care.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <GooglePlayButton />
            <a className="btn btn-secondary" href={assetUrl("/#contact")}>
              Discuss a Project
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">
            Google Play listing: {siteConfig.playStoreTitle} ·{" "}
            {siteConfig.packageName} · version {siteConfig.version}
          </p>
        </div>
      </header>

      <section className="border-t border-line" aria-labelledby="includes-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <h2 id="includes-heading" className="section-title">
            What the app includes
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            These are capabilities present in the current application.
          </p>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {capabilities.map((item) => (
              <li key={item.title} className="card h-full">
                <h3 className="font-medium tracking-[-0.02em]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-t border-line bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]"
        aria-labelledby="product-flow-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <h2 id="product-flow-heading" className="section-title">
            How someone uses it
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="card h-full">
                <p className="font-mono text-sm text-sage">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="responsible-use"
        className="scroll-mt-24 border-t border-line"
        aria-labelledby="responsible-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <h2 id="responsible-heading" className="section-title">
            Responsible use
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
            Oppuna supports everyday emotional wellness and self-reflection. It
            does not provide medical advice, diagnosis, treatment, or emergency
            assistance. If you may harm yourself or someone else, contact local
            emergency services or a verified crisis-support service immediately.
          </p>
          <h3 className="mt-10 text-sm font-medium uppercase tracking-[0.14em] text-sage">
            India support resources
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {siteConfig.crisisIndia.map((line) => (
              <li key={line.phone} className="card">
                <p className="font-medium">{line.label}</p>
                <a className="mt-1 inline-block text-lg link" href={`tel:${line.phone}`}>
                  {line.display}
                </a>
                <p className="mt-1 text-sm text-muted">{line.detail}</p>
                <p className="mt-2 text-xs">
                  <a
                    className="link"
                    href={line.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {line.sourceLabel}
                  </a>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Helpline numbers can change. Prefer official government channels,
            and dial local emergency services if you are in immediate danger.
          </p>
        </div>
      </section>

      <section className="border-t border-line" aria-labelledby="faq-heading">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-24">
          <h2 id="faq-heading" className="section-title">
            Questions
          </h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faqs.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {item.q}
                    <span aria-hidden className="text-muted group-open:hidden">
                      +
                    </span>
                    <span aria-hidden className="hidden text-muted group-open:inline">
                      –
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line" aria-labelledby="get-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 id="get-heading" className="text-3xl font-medium tracking-[-0.03em]">
            Get Oppuna
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Published on Google Play by {siteConfig.companyName}. Questions
            about the app go to{" "}
            <a className="link" href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <GooglePlayButton />
            <Link className="btn btn-secondary" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="btn btn-secondary" href="/support">
              Support
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
