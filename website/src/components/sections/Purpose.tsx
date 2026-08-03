export function Purpose() {
  return (
    <section
      id="purpose"
      className="scroll-mt-24 border-y border-line bg-surface"
      aria-labelledby="purpose-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          Why Oppuna exists
        </p>
        <h2
          id="purpose-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          A quiet place to make sense of your day
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Private by default",
              body: "Reflect without signing into another account or performing for a feed.",
            },
            {
              title: "Small practices",
              body: "Mood check-ins, journaling, and breathing—simple tools you can return to.",
            },
            {
              title: "Works offline",
              body: "Designed for airplane mode so wellness tools do not depend on a strong signal.",
            },
          ].map((item) => (
            <article key={item.title} className="max-w-md">
              <h3 className="font-display text-xl font-semibold text-sage-deep">
                {item.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-sm text-muted">
          Oppuna does not claim to cure anxiety, depression, or any medical
          condition. It is a self-help companion for everyday emotional wellness.
        </p>
      </div>
    </section>
  );
}
