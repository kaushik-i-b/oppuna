import { Section } from "./Section";

const reasons = [
  {
    title: "Hands-on Engineering",
    body: "Architecture and implementation are not separated into layers of account management.",
  },
  {
    title: "AI + Software Engineering",
    body: "We build the complete system around the model — APIs, applications, integrations, security and infrastructure.",
  },
  {
    title: "Vendor-neutral AI",
    body: "We select models and architecture based on the problem rather than forcing every use case onto one LLM.",
  },
  {
    title: "Production-first",
    body: "Evaluation, reliability, security and observability are treated as engineering requirements from day one.",
  },
];

export function Why() {
  return (
    <Section
      id="about"
      tone="band"
      eyebrow="About"
      headingId="about-heading"
      title="Senior engineering without enterprise bureaucracy."
      intro={
        <p>
          Oppuna Labs is a product engineering studio. The same practice that
          ships Oppuna, a private AI wellness application, applies that
          production discipline to client systems.
        </p>
      }
    >
      <ul className="grid gap-4 md:grid-cols-2">
        {reasons.map((reason) => (
          <li key={reason.title} className="card h-full">
            <h3 className="text-xl font-medium tracking-[-0.03em]">
              {reason.title}
            </h3>
            <p className="mt-3 leading-relaxed text-muted">{reason.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
