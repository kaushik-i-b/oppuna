import {
  FileSearch,
  Headset,
  BookOpen,
  Workflow,
  Rocket,
  AudioLines,
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const cards = [
  {
    icon: Headset,
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
    icon: BookOpen,
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
    icon: FileSearch,
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
    icon: Workflow,
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
    icon: Rocket,
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
    icon: AudioLines,
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

export function Solutions() {
  return (
    <section
      id="solutions"
      aria-labelledby="solutions-heading"
      className="border-t border-line"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <SectionHeading
          id="solutions-heading"
          eyebrow="Solutions"
          title="AI should solve a business problem — not create another experiment."
          lead="We take a business problem and design, build and deploy the AI system that solves it. These are the problem areas we work in most."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-accent/40 md:p-7"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <card.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {card.title}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                {card.body}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Examples
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {card.examples.map((example) => (
                  <li
                    key={example}
                    className="rounded-full border border-line bg-white/[0.02] px-3 py-1 text-[0.8rem] text-muted"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
