import { Section } from "./Section";

const controls = [
  "Role-based access",
  "Human approval",
  "Audit logs",
  "PII handling",
  "Data boundaries",
  "Prompt-injection defenses",
  "Guardrails",
  "Evaluation pipelines",
  "Model fallback strategies",
  "Observability",
  "Cost controls",
];

export function Security() {
  return (
    <Section
      id="security"
      tone="band"
      eyebrow="Production"
      headingId="security-heading"
      title="Built for production, not just demos."
      intro={
        <>
          <p>Production AI systems need more than a prompt.</p>
          <p>Oppuna Labs designs systems with:</p>
        </>
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {controls.map((control) => (
          <li
            key={control}
            className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3 text-[0.98rem]"
          >
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full bg-sage"
              aria-hidden
            />
            {control}
          </li>
        ))}
      </ul>
    </Section>
  );
}
