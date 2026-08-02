import { siteConfig } from "@/config/site";

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
    q: "Who can use it?",
    a: "Oppuna is designed for general, everyday emotional wellness. It is a self-help companion—not a clinical service.",
  },
  {
    q: "Which languages are available?",
    a: `The interface includes ${siteConfig.languagesMention.join(", ")}, among others selectable in the app.`,
  },
  {
    q: "Does it work offline?",
    a: "Yes. Production builds are designed for airplane-mode use. Outbound internet access is blocked, and your journals, moods, and preferences are stored locally on the device.",
  },
  {
    q: "How does the AI companion work?",
    a: "Conversational support can use a language model that runs on your device. If the model is unavailable, Oppuna still offers guided offline support. The app does not send your chats to a cloud AI service for processing.",
  },
  {
    q: "What happens to my personal information?",
    a: "The app does not create an Oppuna cloud account or analytics pipeline for your content. Export a local JSON copy or permanently delete data from Settings. See the Privacy Policy for the full statement.",
  },
  {
    q: "Is Oppuna free?",
    a: "Oppuna is available on Google Play with no paid subscription or in-app purchase wired in the current app. If that changes, it will be disclosed clearly in the store listing and in-app.",
  },
  {
    q: "Where can I download it?",
    a: `Download Oppuna on Google Play: ${siteConfig.googlePlayUrl}`,
  },
  {
    q: "How can I contact support?",
    a: `Email ${siteConfig.supportEmail}, or use the Support page on this website.`,
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24" aria-labelledby="faq-heading">
      <div className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          FAQ
        </p>
        <h2
          id="faq-heading"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          Questions, answered honestly
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface px-5 py-4 open:pb-5"
            >
              <summary className="cursor-pointer list-none font-semibold text-sage-deep marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {item.q}
                  <span
                    className="mt-0.5 text-sage transition group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
