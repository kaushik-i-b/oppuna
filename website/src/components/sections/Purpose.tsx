export function Purpose() {
  return (
    <section
      id="purpose"
      className="scroll-mt-24 border-y border-line bg-surface"
      aria-labelledby="purpose-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          Why Oppuna exists
        </p>
        <h2
          id="purpose-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          Everyone deserves a quiet place to make sense of their day.
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {[
            {
              title: "A private space to process",
              body: "People often need somewhere private to notice what they are feeling—without performing for a feed or signing into another account.",
            },
            {
              title: "Support between appointments",
              body: "Professional care is not always immediately available. Oppuna offers simple self-help tools you can return to between fuller conversations with a clinician.",
            },
            {
              title: "Small practices, repeated",
              body: "Checking in with your mood, writing a few lines, or breathing for a few minutes can help you understand patterns over time.",
            },
            {
              title: "Wellness tools that stay with you",
              body: "Oppuna is designed to work offline on your Android phone, so everyday reflection does not depend on a strong signal or a cloud login.",
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
        <p className="mt-10 max-w-2xl text-sm text-muted">
          Oppuna does not claim to cure anxiety, depression, or any medical
          condition. It is a self-help companion for everyday emotional wellness.
        </p>
      </div>
    </section>
  );
}
