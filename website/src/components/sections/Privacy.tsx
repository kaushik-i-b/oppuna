import Link from "next/link";
import { siteConfig } from "@/config/site";

const pillars = [
  {
    title: "No account required",
    body: "Open Oppuna and begin. There is no sign-up, email capture, or cloud profile created by the app.",
  },
  {
    title: "Content stays on your phone",
    body: "Journals, moods, conversations, preferences, and voice notes are stored in the app’s local storage. The app does not upload or sync them to Oppuna servers.",
  },
  {
    title: "Designed to work offline",
    body: "Production builds block outbound internet access. You can use Oppuna in airplane mode. Supportive AI can run on-device when the local model is available; otherwise guided offline support still helps.",
  },
];

export function PrivacySection() {
  return (
    <section
      id="privacy"
      className="scroll-mt-24"
      aria-labelledby="privacy-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          Privacy
        </p>
        <h2
          id="privacy-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          Privacy by architecture, explained plainly
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Oppuna is built so your reflective content does not need to leave your
          device for the app to work. We do not claim certifications we have not
          earned—only what the product actually does.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-3xl border border-line bg-surface p-6"
            >
              <div className="mb-4 h-0.5 w-9 bg-sage" aria-hidden />
              <h3 className="font-display text-xl font-semibold text-sage-deep">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-line bg-sage-soft/40 p-6 md:p-8">
          <h3 className="font-display text-lg font-semibold text-sage-deep">
            A note on technology
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            Conversational support can use an on-device language model bundled
            with the Android app. Inference is intended to run locally. Safety
            checks may pause coaching and show crisis resources on your device.
            Microphone access is only for optional voice notes you choose to
            record locally—there is no speech-to-text upload.
          </p>
          <p className="mt-4 text-sm">
            <Link
              href={siteConfig.legal.privacyPath}
              className="font-semibold text-sage-deep underline decoration-sage/40 underline-offset-4 hover:decoration-sage"
            >
              Read the full Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
