import { Section } from "./Section";

const stages = [
  {
    title: "Understand",
    body: "We start with the workflow, users, systems and measurable business problem.",
  },
  {
    title: "Design",
    body: "Architecture, model selection, data strategy, security, integrations and evaluation criteria.",
  },
  {
    title: "Build",
    body: "Rapid implementation of the working system using production-quality engineering.",
  },
  {
    title: "Validate",
    body: "Real-world evaluation, human review, failure testing, guardrails and performance measurement.",
  },
  {
    title: "Deploy & Improve",
    body: "Production deployment, monitoring, iteration and handover.",
  },
];

const models = [
  {
    title: "Fixed-scope project",
    body: "A defined problem, outcome, and delivery boundary.",
  },
  {
    title: "AI proof of value",
    body: "A narrow workflow used to learn whether AI should go further.",
  },
  {
    title: "Production implementation",
    body: "The system, integrations, evaluation, and deployment.",
  },
  {
    title: "Engineering retainer",
    body: "Continued iteration after the first production release.",
  },
  {
    title: "Architecture + delivery engagement",
    body: "Design and implementation carried by the same team.",
  },
];

export function Process() {
  return (
    <Section
      id="how-we-work"
      tone="band"
      eyebrow="How we work"
      headingId="process-heading"
      title="From business problem to production system."
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage, index) => (
          <li key={stage.title} className="card h-full">
            <p className="font-mono text-sm text-sage">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-4 text-lg font-medium tracking-[-0.03em]">
              {stage.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{stage.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14">
        <h3 className="text-2xl font-medium tracking-[-0.03em]">
          Typical engagement models
        </h3>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {models.map((model) => (
            <li
              key={model.title}
              className="grid gap-1 py-4 md:grid-cols-[18rem_1fr] md:items-baseline md:gap-8"
            >
              <h4 className="font-medium">{model.title}</h4>
              <p className="text-sm leading-relaxed text-muted md:text-base">
                {model.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
