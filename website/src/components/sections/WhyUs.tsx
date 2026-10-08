import { Compass, Layers, Scale, ServerCog } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const cards = [
  {
    icon: Layers,
    title: "Hands-on Engineering",
    body: "Architecture and implementation are not separated into layers of account management.",
  },
  {
    icon: ServerCog,
    title: "AI + Software Engineering",
    body: "We build the complete system around the model — APIs, applications, integrations, security and infrastructure.",
  },
  {
    icon: Scale,
    title: "Vendor-neutral AI",
    body: "We select models and architecture based on the problem rather than forcing every use case onto one LLM.",
  },
  {
    icon: Compass,
    title: "Production-first",
    body: "Evaluation, reliability, security and observability are treated as engineering requirements from day one.",
  },
];

export function WhyUs() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-t border-line"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <SectionHeading
          id="about-heading"
          eyebrow="Why Oppuna Labs"
          title="Senior engineering without enterprise bureaucracy."
          lead="A technically strong boutique AI engineering studio — built for enterprise clients in the UAE/Gulf, the US and Europe who need systems that ship."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-line bg-surface p-6"
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
