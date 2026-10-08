import { Section } from "./Section";

const groups = [
  {
    title: "AI / LLM",
    body: "Model choice, retrieval, and orchestration selected for the workflow.",
    span: "lg:col-span-4",
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
    body: "Services and APIs that agents and operators can call reliably.",
    span: "lg:col-span-2",
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
    body: "Run the system where the data and the operators already are.",
    span: "lg:col-span-2",
    items: ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Serverless"],
  },
  {
    title: "Data",
    body: "Store records, cache state, and retrieve the right context.",
    span: "lg:col-span-2",
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
    body: "Interfaces for the people who use and supervise the system.",
    span: "lg:col-span-2",
    items: ["React", "Next.js", "Angular", "React Native", "Flutter"],
  },
];

export function Engineering() {
  return (
    <Section
      id="engineering"
      eyebrow="Engineering"
      headingId="engineering-heading"
      title="AI is only useful when the engineering around it works."
      intro={
        <p>
          The model is one component. A production system also needs
          applications, APIs, data, infrastructure, and a way to see what it
          did. Platforms are chosen per engagement. A name on this list is an
          implementation option, not a partnership or certification.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-6">
        {groups.map((group) => (
          <article key={group.title} className={`card h-full ${group.span}`}>
            <h3 className="text-lg font-medium tracking-[-0.03em]">
              {group.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{group.body}</p>
            <ul className="tech-list" aria-label={`${group.title} technologies`}>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
