import { GooglePlayButton } from "../GooglePlayButton";

export function FinalCTA() {
  return (
    <section
      id="download"
      className="scroll-mt-24"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sage to-sage-deep px-7 py-12 text-white md:px-12 md:py-16">
          <div
            className="pointer-events-none absolute -right-16 -bottom-24 size-80 rounded-full bg-white/10"
            aria-hidden
          />
          <div className="relative max-w-xl">
            <h2
              id="cta-heading"
              className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Give yourself a little space to reflect.
            </h2>
            <p className="mt-4 text-lg text-white/85">
              Download Oppuna on Google Play when you are ready for a calmer,
              private wellness companion.
            </p>
            <div className="mt-8">
              <GooglePlayButton variant="light" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
