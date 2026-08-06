const useCases = [
  {
    id: "private-mood-journal",
    title: "Private mood journal",
    description:
      "Log how you feel and write freely in a journal that stays on your phone—no mandatory account.",
  },
  {
    id: "on-device-ai",
    title: "On-device AI wellness",
    description:
      "Reflect with supportive on-device AI when available, with guided fallbacks if the model is offline.",
  },
  {
    id: "mood-tracking",
    title: "Mood tracking",
    description:
      "Check in with intensity and tags, then notice weekly patterns without sending notes to the cloud.",
  },
  {
    id: "around-therapy",
    title: "Journaling around therapy",
    description:
      "Capture thoughts before or between professional sessions so you can arrive better prepared—Oppuna does not replace clinicians.",
  },
  {
    id: "privacy-first",
    title: "Privacy-first emotional wellness",
    description:
      "Breathing, grounding, sleep wind-down, and local storage designed so your emotional content remains under your control.",
  },
] as const;

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="scroll-mt-24 border-y border-line bg-surface"
      aria-labelledby="use-cases-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          Use cases
        </p>
        <h2
          id="use-cases-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          Built for private emotional wellness on Android
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Clear ways people use Oppuna—without clinical claims or cloud sync for
          your entries.
        </p>

        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item, index) => (
            <li
              key={item.id}
              id={item.id}
              className="rounded-2xl bg-background p-6 ring-1 ring-line"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold text-sage-deep">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
