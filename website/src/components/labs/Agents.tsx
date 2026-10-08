import { Section } from "./Section";

const flow = [
  {
    title: "User / Business Event",
    detail:
      "A person, document, message, call, or system event starts the work.",
  },
  {
    title: "AI Agent",
    detail:
      "A bounded agent with a defined job and only the context it is allowed to see.",
  },
  {
    title: "Reasoning / Orchestration",
    detail:
      "The agent plans the next step, including multi-step and multi-agent workflows.",
  },
  {
    title: "Enterprise Knowledge / RAG",
    detail:
      "Retrieval stays inside approved documents, policies, and records, with sources attached.",
  },
  {
    title: "Tools & APIs",
    detail:
      "The agent calls specific functions to read or update business systems.",
  },
  {
    title: "Business Systems",
    detail:
      "CRM, ERP, email, case tools, and internal APIs where the work already lives.",
  },
  {
    title: "Human Approval where required",
    detail: "Actions that need a person pause until someone approves them.",
  },
  {
    title: "Audit / Evaluation / Observability",
    detail:
      "Decisions, tool calls, failures, and cost stay reviewable after the fact.",
  },
];

const capabilities = [
  {
    title: "Tool calling",
    detail: "Agents invoke approved functions as part of the workflow.",
  },
  {
    title: "Multi-agent workflows",
    detail: "Separate roles when a handoff should stay explicit.",
  },
  {
    title: "MCP integrations",
    detail: "Connect agents to tools through the Model Context Protocol.",
  },
  {
    title: "Retrieval",
    detail: "Ground answers in the documents and records you choose.",
  },
  {
    title: "Memory",
    detail: "Keep only the context a workflow is allowed to reuse.",
  },
  {
    title: "API integrations",
    detail: "Read and write the systems the business already runs.",
  },
  {
    title: "Guardrails",
    detail: "Constrain inputs, outputs, and actions before they proceed.",
  },
  {
    title: "Human-in-the-loop",
    detail: "Pause for approval when the action needs a person.",
  },
  {
    title: "Evaluation",
    detail: "Measure quality against cases from the real workflow.",
  },
  {
    title: "Auditability",
    detail: "Record what the system saw, decided, and did.",
  },
  {
    title: "Observability",
    detail: "See failures, latency, and cost after go-live.",
  },
];

export function Agents() {
  return (
    <Section
      id="agents"
      eyebrow="AI agents"
      headingId="agents-heading"
      title="Agents that can actually do work."
      intro={
        <p>
          An Oppuna Labs agent is a system: reasoning, knowledge, tools,
          business software, human approval, and a record of what happened.
        </p>
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="card md:p-8">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-sage">
            System flow
          </p>
          <ol className="agent-flow mt-6" aria-label="Agent system architecture">
            {flow.map((step, index) => (
              <li key={step.title} className="agent-flow-step">
                <span className="agent-flow-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pt-1">
                  <h3 className="text-base font-medium tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card md:p-8">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-sage">
            Capabilities
          </p>
          <ul className="mt-6 space-y-4">
            {capabilities.map((item) => (
              <li key={item.title}>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
