import { Section } from "./Section";

const problems = [
  {
    title: "Customer Operations",
    body: "Build AI agents that answer questions, perform actions, access business systems and escalate to humans when necessary.",
    examples: [
      "Support automation",
      "Customer self-service",
      "Voice assistants",
      "CRM integrations",
    ],
  },
  {
    title: "Internal Knowledge",
    body: "Turn company documents, policies, databases and systems into citation-grounded AI knowledge tools.",
    examples: [
      "Enterprise search",
      "Internal copilots",
      "Policy assistants",
      "Regulatory intelligence",
      "Knowledge retrieval",
    ],
  },
  {
    title: "Document Intelligence",
    body: "Transform unstructured documents into validated structured workflows.",
    examples: [
      "Invoice extraction",
      "Contract analysis",
      "Claims processing",
      "Forms",
      "PDFs",
      "OCR pipelines",
      "Human approval workflows",
    ],
  },
  {
    title: "Workflow Automation",
    body: "Connect AI reasoning with real business systems.",
    examples: [
      "Email → analysis → approval → action",
      "CRM automation",
      "ERP integrations",
      "Case management",
      "Operational workflows",
    ],
  },
  {
    title: "AI Product Development",
    body: "Take an AI product from concept to production.",
    examples: [
      "SaaS products",
      "AI-native applications",
      "Internal platforms",
      "Mobile applications",
      "Enterprise tools",
    ],
  },
  {
    title: "Voice AI",
    body: "Build real-time conversational systems.",
    examples: [
      "Customer support",
      "Appointment handling",
      "Lead qualification",
      "Internal assistants",
      "Multilingual workflows",
    ],
  },
];

export function Problems() {
  return (
    <Section
      id="solutions"
      tone="band"
      eyebrow="Solutions"
      headingId="solutions-heading"
      title="AI should solve a business problem — not create another experiment."
      intro={
        <p>
          Oppuna Labs takes an operational or product problem and designs,
          builds and deploys the AI system that addresses it.
        </p>
      }
    >
      <ul className="grid gap-4 md:grid-cols-2">
        {problems.map((problem) => (
          <li key={problem.title} className="card flex h-full flex-col">
            <h3 className="text-xl font-medium tracking-[-0.03em]">
              {problem.title}
            </h3>
            <p className="mt-3 leading-relaxed text-muted">{problem.body}</p>
            <p className="mt-5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-sage">
              Examples
            </p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${problem.title} examples`}>
              {problem.examples.map((example) => (
                <li
                  key={example}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-muted"
                >
                  {example}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
