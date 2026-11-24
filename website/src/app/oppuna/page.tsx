import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { GooglePlayButton } from "@/components/GooglePlayButton";
import { PhonePreview } from "@/components/PhonePreview";
import { ProductJsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Oppuna — Private AI Mood Journal & Wellness App for Android",
  description: siteConfig.productDescription,
  path: "/oppuna",
  image: {
    path: "/brand/feature-image.png",
    width: 1024,
    height: 500,
    alt: "Oppuna — private mental wellness support",
  },
});

const privacyPoints = [
  {
    title: "No account",
    body: "There is nothing to sign up for. You can start using the app straight away.",
  },
  {
    title: "Stored on your device",
    body: "Journals, mood check-ins, chats and preferences are kept in the app's local storage.",
  },
  {
    title: "No internet in release builds",
    body: "Production Android builds block the INTERNET permission, and a network guard is built in.",
  },
  {
    title: "AI that runs on the phone",
    body: "The companion uses a language model on the device. Chats are not sent to a cloud AI service.",
  },
];

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
  {
    q: "Can Oppuna book a psychiatrist or psychologist?",
    a: "Appointment booking, payments, and clinical care stay outside Oppuna. The Find Professionals page is an informational preview with fictional profiles only.",
  },
];

export default function OppunaProductPage() {
  return (
    <article>
      <ProductJsonLd />
      <header className="border-b border-line">
        <div className="wrap grid items-center gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="eyebrow">Oppuna · Android app</p>
            <h1 className="mt-6 text-[clamp(2.25rem,4.4vw,3.375rem)] leading-[1.06] tracking-[-0.02em]">
              Oppuna. A private
              <br />
              space to reflect.
            </h1>
            <p className="lede mt-6">
              A wellness app for journaling, mood check-ins and a calm daily
              routine. It works without an account, and what you write stays
              on your phone.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <GooglePlayButton />
              <a className="btn btn-secondary" href="#privacy">
                How privacy works
              </a>
            </div>
            <p className="mt-8 text-sm text-muted">
              Free on Google Play as “{siteConfig.playStoreTitle}” · version{" "}
              {siteConfig.version} · {siteConfig.winfin.productStatement}
            </p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <PhonePreview />
          </div>
        </div>
      </header>

      <section aria-labelledby="includes-heading" className="border-b border-line">
        <div className="wrap py-16 md:py-24">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <h2 id="includes-heading" className="section-title lg:col-span-6">
              What the app includes
            </h2>
            <p className="text-muted lg:col-span-5 lg:col-start-8">
              These features are in the current version of the app.
            </p>
          </div>
          <ul className="mt-10 grid border-t border-foreground md:grid-cols-2 md:gap-x-12">
            {capabilities.map((item) => (
              <li
                key={item.title}
                className="grid gap-1 border-b border-line py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
              >
                <h3 className="text-base">{item.title}</h3>
                <p className="text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="privacy"
        aria-labelledby="privacy-heading"
        className="section-dark scroll-mt-16"
      >
        <div className="wrap py-16 md:py-24">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6">
              <p className="eyebrow">Privacy</p>
              <h2 id="privacy-heading" className="section-title mt-5">
                Built to work
                <br />
                without the internet.
              </h2>
            </div>
            <p className="text-muted lg:col-span-5 lg:col-start-8">
              Your operating system may still offer device-level backups
              outside Oppuna’s control. The{" "}
              <Link className="link" href="/privacy">
                privacy policy
              </Link>{" "}
              has the full details.
            </p>
          </div>
          <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {privacyPoints.map((point) => (
              <li key={point.title} className="border-t-2 border-foreground pt-5">
                <h3 className="text-lg">{point.title}</h3>
                <p className="mt-2 text-muted">{point.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="product-flow-heading" className="border-b border-line">
        <div className="wrap py-16 md:py-24">
          <h2 id="product-flow-heading" className="section-title">
            How someone uses it
          </h2>
          <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-foreground pt-5">
                <p className="font-mono text-sm text-accent-text">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-lg">{step.title}</h3>
                <p className="mt-2 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="responsible-use"
        className="scroll-mt-16 border-b border-line bg-surface"
        aria-labelledby="responsible-heading"
      >
        <div className="wrap grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 id="responsible-heading" className="section-title">
              Responsible use
            </h2>
            <p className="mt-5 text-muted">
              Oppuna supports everyday emotional wellness and self-reflection.
              It does not provide medical advice, diagnosis, treatment, or
              emergency assistance. If you may harm yourself or someone else,
              contact local emergency services or a verified crisis-support
              service immediately.
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <h3 className="label-mono">India support resources</h3>
            <ul className="mt-4 border-t border-foreground">
              {siteConfig.crisisIndia.map((line) => (
                <li
                  key={line.phone}
                  className="grid gap-1 border-b border-line py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
                >
                  <a
                    className="link font-display text-lg font-semibold"
                    href={`tel:${line.phone}`}
                  >
                    {line.display}
                  </a>
                  <div>
                    <p className="font-semibold">{line.label}</p>
                    <p className="text-muted">
                      {line.detail} · Source:{" "}
                      <a
                        className="link"
                        href={line.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {line.sourceLabel}
                      </a>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Helpline numbers can change. Prefer official government channels,
              and dial local emergency services if you are in immediate danger.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line" aria-labelledby="faq-heading">
        <div className="wrap grid gap-10 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <h2 id="faq-heading" className="section-title lg:col-span-4">
            Questions
          </h2>
          <div className="border-t border-foreground lg:col-span-8">
            {faqs.map((item) => (
              <details key={item.q} className="service-row">
                <summary className="!grid-cols-[minmax(0,1fr)_2rem] !gap-4 !py-5">
                  <h3 className="service-title text-base leading-snug transition-colors md:text-lg">
                    {item.q}
                  </h3>
                  <span className="service-toggle" aria-hidden />
                </summary>
                <p className="max-w-2xl pb-6 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="get-heading">
        <div className="wrap grid gap-8 py-16 md:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 id="get-heading" className="section-title">
              Get Oppuna
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              The Google Play listing is published by {siteConfig.companyName}.
              Questions about the app go to{" "}
              <a className="link" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <GooglePlayButton />
            <Link className="btn btn-secondary" href="/support">
              App support
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
