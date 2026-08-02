import { GooglePlayButton } from "../GooglePlayButton";
import { PhoneMockup } from "../PhoneMockup";

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_10%,rgba(61,107,90,0.14),transparent_55%),linear-gradient(180deg,#eef4f0_0%,var(--bg)_55%,var(--bg)_100%)]"
        aria-hidden
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:px-8 md:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
            Private wellness · Offline on Android
          </p>
          <h1
            id="hero-heading"
            className="mt-4 font-display text-[clamp(2.4rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-sage-deep"
          >
            A private space to pause, reflect and move forward.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Oppuna gives you calm, everyday tools for emotional wellness—mood
            check-ins, journaling, a gentle daily plan, and a supportive
            companion that can run on your phone without sending your thoughts
            to the cloud.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GooglePlayButton />
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-sage/30 bg-transparent px-6 py-3 text-[0.95rem] font-semibold text-sage-deep transition-colors hover:border-sage hover:bg-sage-soft/50"
            >
              Explore features
            </a>
          </div>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
            Built for everyday wellness—not a replacement for professional care.
          </p>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}
