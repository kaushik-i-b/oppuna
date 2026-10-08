import { ShieldCheck } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const practices = [
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
    <section
      id="security"
      aria-labelledby="security-heading"
      className="border-t border-line"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div>
            <SectionHeading
              id="security-heading"
              eyebrow="Security · Responsible AI"
              title="Built for production, not just demos."
            />
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Production AI systems need more than a prompt.
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              We design every system with access control, human oversight,
              auditability and evaluation from day one — so it can run on real
              business data, for real users, under real accountability.
            </p>
            <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-accent"
                aria-hidden
              />
              We describe concrete engineering practices, not certifications we
              don&apos;t hold. If your deployment needs a specific compliance
              review, we design for it with you.
            </p>
          </div>
          <ul
            className="grid content-start gap-3 sm:grid-cols-2"
            aria-label="Production practices we design into every system"
          >
            {practices.map((practice) => (
              <li
                key={practice}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-[0.95rem] font-medium"
              >
                <span
                  className="inline-flex size-2 shrink-0 rounded-full bg-accent"
                  aria-hidden="true"
                />
                {practice}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
