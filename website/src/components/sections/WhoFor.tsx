import { siteConfig } from "@/config/site";

const audiences = [
  "Adults who want a private place to reflect on everyday thoughts and emotions",
  "People building small, consistent wellness habits",
  "Anyone looking for calm tools during stressful moments",
  "Users who prefer journaling and CBT-inspired prompts without a social feed",
  "People who want supportive guidance that can work offline on Android",
];

export function WhoFor() {
  return (
    <section
      id="who"
      className="scroll-mt-24 border-y border-line bg-surface"
      aria-labelledby="who-heading"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
            Who it is for
          </p>
          <h2
            id="who-heading"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
          >
            Built for everyday emotional wellness
          </h2>
          <p className="mt-4 text-muted">
            Oppuna is intended for general wellbeing. On Google Play it is rated{" "}
            {siteConfig.legal.ageGuidance}.
          </p>
        </div>
        <ul className="space-y-3">
          {audiences.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-line bg-background px-5 py-4 text-[0.95rem] leading-relaxed text-sage-deep"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
