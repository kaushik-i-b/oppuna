const steps = [
  {
    title: "Share how you are arriving",
    body: "During setup, optionally share your name, how you have been feeling, your goals, and how many minutes you have today.",
  },
  {
    title: "Understand privacy & consent",
    body: "Read how Oppuna keeps content on your device, then confirm the medical disclaimer before continuing.",
  },
  {
    title: "Follow a gentle daily plan",
    body: "Oppuna prepares a personalized plan. Open activities—journal, mood, breathing, grounding, sleep, or chat—at your own pace.",
  },
  {
    title: "Return and notice patterns",
    body: "Check in again, review insights, and keep building small habits without needing an account.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-line bg-[linear-gradient(180deg,#eef4f0_0%,var(--bg)_100%)]"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          How it works
        </p>
        <h2
          id="how-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          Start gently. Stay private.
        </h2>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <p className="font-display text-sm font-semibold text-sage">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-sage-deep">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
