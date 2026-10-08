import { SectionHeading } from "./SectionHeading";

const stages = [
  {
    step: "01",
    title: "Understand",
    body: "We start with the workflow, users, systems and measurable business problem.",
  },
  {
    step: "02",
    title: "Design",
    body: "Architecture, model selection, data strategy, security, integrations and evaluation criteria.",
  },
  {
    step: "03",
    title: "Build",
    body: "Rapid implementation of the working system using production-quality engineering.",
  },
  {
    step: "04",
    title: "Validate",
    body: "Real-world evaluation, human review, failure testing, guardrails and performance measurement.",
  },
  {
    step: "05",
    title: "Deploy & Improve",
    body: "Production deployment, monitoring, iteration and handover.",
  },
];

const engagements = [
  {
    title: "Fixed-scope project",
    body: "A defined problem, a defined system, a defined delivery.",
  },
  {
    title: "AI proof of value",
    body: "A working system on your real data to prove value before scaling.",
  },
  {
    title: "Production implementation",
    body: "Taking a validated concept into a hardened production deployment.",
  },
  {
    title: "Engineering retainer",
    body: "Ongoing senior engineering for teams shipping AI continuously.",
  },
  {
    title: "Architecture + delivery engagement",
    body: "Design the right system, then stay to build it with you.",
  },
];

export function HowWeWork() {
  return (
    <section
      id="how-we-work"
      aria-labelledby="how-we-work-heading"
      className="border-t border-line"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <SectionHeading
          id="how-we-work-heading"
          eyebrow="How We Work"
          title="From business problem to production system."
          lead="A delivery process designed to end in software running in your business — not a slide deck."
        />

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {stages.map((stage) => (
            <li
              key={stage.step}
              className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6"
            >
              <p
                className="font-display text-4xl font-semibold text-accent/70"
                aria-hidden="true"
              >
                {stage.step}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {stage.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {stage.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-line bg-surface p-6 md:p-8">
          <h3 className="text-lg font-semibold tracking-tight">
            Typical engagement models
          </h3>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {engagements.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-line bg-white/[0.02] p-5"
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
            <li className="rounded-xl border border-dashed border-line p-5">
              <p className="font-semibold text-muted">Not offered</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Staff augmentation. We deliver systems as an engineering
                partner, not headcount.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
