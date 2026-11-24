const services = [
  {
    title: "Document workflows",
    summary:
      "Turn invoices, forms, contracts and claims into checked, structured data.",
    detail:
      "We build pipelines that read your documents, pull out the fields you need, check them against your records and send exceptions to a person for review.",
    examples: ["Supplier invoices", "Application forms", "Contract review", "Claims intake"],
  },
  {
    title: "AI agents for operations",
    summary:
      "Assistants that answer questions and take approved actions in the tools your team already uses.",
    detail:
      "Agents look things up, draft replies, update records and hand over to a person when a decision needs one. Each agent can only do what you allow, and its actions are logged.",
    examples: ["Support triage", "Internal help desks", "CRM updates", "Scheduling"],
  },
  {
    title: "Search across your documents",
    summary:
      "Ask questions of policies, manuals and records, and get answers that cite their source.",
    detail:
      "Answers are drawn only from the material you approve, with links back to the passage they came from, so people can check them before acting.",
    examples: ["Policy questions", "Product manuals", "Onboarding", "Case history"],
  },
  {
    title: "Custom software and AI products",
    summary:
      "Web and mobile applications built around AI, from the first version to launch.",
    detail:
      "The model is one part of a product. We also build the interface, APIs, data storage and deployment. Oppuna, our own Android app, is an example of this work.",
    examples: ["Web applications", "Android apps", "Internal tools", "APIs"],
  },
  {
    title: "Improving an existing AI system",
    summary:
      "For prototypes that work in a demo but not yet in daily use.",
    detail:
      "We test the system against real cases from your workflow, find where it fails and fix what matters most: retrieval, prompts, guardrails, monitoring and running cost.",
    examples: ["Evaluation sets", "Failure analysis", "Guardrails", "Cost review"],
  },
];

export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-16 border-b border-line"
    >
      <div className="wrap py-20 md:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="eyebrow">Services</p>
            <h2 id="services-heading" className="section-title mt-5">
              What we build
              <br />
              with our clients.
            </h2>
          </div>
          <p className="text-muted lg:col-span-5 lg:col-start-8">
            Each engagement starts from a specific task that takes people too
            long today. Models are chosen per project; we have no vendor
            partnerships to steer that choice.
          </p>
        </div>

        <div className="mt-12 border-t border-foreground">
          {services.map((service, index) => (
            <details
              key={service.title}
              className="service-row group"
              {...(index === 0 ? { open: true } : {})}
            >
              <summary>
                <span className="font-mono text-sm text-muted" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="service-title text-lg leading-snug transition-colors md:text-xl">
                  {service.title}
                </h3>
                <p className="col-start-2 text-muted max-[899px]:row-start-2 min-[900px]:col-start-3">
                  {service.summary}
                </p>
                <span
                  className="service-toggle max-[899px]:col-start-3 max-[899px]:row-start-1 min-[900px]:col-start-4"
                  aria-hidden
                />
              </summary>
              <div className="grid gap-6 pb-8 pl-[3.25rem] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:gap-8 min-[900px]:pl-[calc(4rem+2rem+20rem+2rem)] min-[900px]:pr-16">
                <p className="max-w-xl">{service.detail}</p>
                <div>
                  <p className="label-mono">Typical uses</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {service.examples.map((example) => (
                      <li
                        key={example}
                        className="border border-line px-2.5 py-1 text-sm text-muted"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
