import { SectionHeading } from "./SectionHeading";

const flow = [
  {
    stage: "User / Business Event",
    detail: "A customer message, a voice call, a new document, a system event.",
  },
  {
    stage: "AI Agent",
    detail: "Understands the request and plans the work.",
  },
  {
    stage: "Reasoning / Orchestration",
    detail: "Multi-step plans, multi-agent handoffs, tool selection.",
  },
  {
    stage: "Enterprise Knowledge / RAG",
    detail: "Grounded answers from your documents, policies and databases.",
  },
  {
    stage: "Tools & APIs",
    detail: "Tool calling, MCP integrations, retrieval, memory.",
  },
  {
    stage: "Business Systems",
    detail: "CRM, ERP, case management, internal platforms.",
  },
  {
    stage: "Human Approval where required",
    detail: "People stay in the loop for sensitive or high-impact actions.",
  },
  {
    stage: "Audit / Evaluation / Observability",
    detail: "Every run logged, scored and observable in production.",
  },
];

const capabilities = [
  "Tool calling",
  "Multi-agent workflows",
  "MCP integrations",
  "Retrieval",
  "Memory",
  "API integrations",
  "Guardrails",
  "Human-in-the-loop",
  "Evaluation",
  "Auditability",
  "Observability",
];

export function Agents() {
  return (
    <section
      id="agents"
      aria-labelledby="agents-heading"
      className="border-t border-line bg-surface/40"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <SectionHeading
          id="agents-heading"
          eyebrow="AI Agents"
          title="Agents that can actually do work."
          lead="Our agents combine reasoning with your knowledge, tools and systems — and hand to a human whenever judgment is required."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <ol
            className="relative"
            aria-label="How an Oppuna Labs agent handles a business event"
          >
            {flow.map((node, i) => (
              <li key={node.stage} className="relative flex gap-4 pb-2">
                <div
                  className="flex flex-col items-center"
                  aria-hidden="true"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-xs font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < flow.length - 1 ? (
                    <span className="flow-line my-1 w-px flex-1 min-h-5" />
                  ) : null}
                </div>
                <div
                  className={`flex-1 rounded-2xl border p-4 md:p-5 ${
                    i === flow.length - 1
                      ? "border-accent/40 bg-accent/[0.06]"
                      : "border-line bg-surface"
                  }`}
                >
                  <p className="font-semibold tracking-tight">{node.stage}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {node.detail}
                  </p>
                </div>
                {i < flow.length - 1 ? (
                  <span className="sr-only">flows into</span>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line bg-surface p-6 md:p-7">
              <h3 className="text-lg font-semibold tracking-tight">
                What our agents are built with
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                The engineering around the model is what makes an agent
                reliable: permissions, grounding, review steps and measurement
                — from the first prototype to production traffic.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="rounded-full border border-accent/25 bg-accent/[0.07] px-3.5 py-1.5 text-sm font-medium text-accent"
                  >
                    {cap}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-line bg-white/[0.02] p-4 text-sm leading-relaxed text-muted">
                No black boxes. Every agent action is traceable back to the
                knowledge it used, the tools it called and the human who
                approved it.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
