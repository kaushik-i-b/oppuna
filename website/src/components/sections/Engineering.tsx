import { SectionHeading } from "./SectionHeading";

const groups = [
  {
    title: "AI / LLM",
    note: "Model-agnostic: the right model and framework for the problem.",
    items: [
      "OpenAI",
      "Azure OpenAI",
      "Claude",
      "Gemini",
      "Qwen",
      "LangChain",
      "LangGraph",
      "RAG",
      "Agent orchestration",
      "Vector search",
      "MCP",
    ],
  },
  {
    title: "Backend",
    note: "APIs and services that hold up under production load.",
    items: [
      "Node.js",
      "TypeScript",
      "Python",
      "Java",
      "Go",
      "REST APIs",
      "Event-driven systems",
      "Microservices",
    ],
  },
  {
    title: "Cloud",
    note: "Deployments you can operate, scale and hand over.",
    items: [
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "Terraform",
      "Serverless",
    ],
  },
  {
    title: "Data",
    note: "Pipelines and stores behind grounded, reliable AI.",
    items: [
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Vector databases",
      "Data pipelines",
    ],
  },
  {
    title: "Applications",
    note: "The interfaces people actually use.",
    items: ["React", "Next.js", "Angular", "React Native", "Flutter"],
  },
];

export function Engineering() {
  return (
    <section
      id="engineering"
      aria-labelledby="engineering-heading"
      className="border-t border-line bg-surface/40"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <SectionHeading
          id="engineering-heading"
          eyebrow="Engineering"
          title="AI is only useful when the engineering around it works."
          lead="Models are one part of the system. We build everything around them — APIs, applications, integrations, data, security and infrastructure — so the whole thing runs in production."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <article
              key={group.title}
              className="rounded-2xl border border-line bg-surface p-6 md:p-7"
            >
              <h3 className="text-lg font-semibold tracking-tight">
                {group.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {group.note}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label={group.title}>
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-line bg-white/[0.02] px-3 py-1.5 font-mono text-[0.8rem] text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
          <article className="flex flex-col justify-center rounded-2xl border border-accent/30 bg-accent/[0.05] p-6 md:p-7">
            <h3 className="text-lg font-semibold tracking-tight">
              Engineering depth, not logo bingo
            </h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
              Every technology above is something we design with, deploy and
              support — chosen per project for fit, cost and operability, never
              forced onto a single stack.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
