const stages = [
  {
    title: "Scope",
    body: "A conversation and a written scope: the workflow, the people who use it, the systems involved and how success will be judged.",
  },
  {
    title: "First working version",
    body: "A narrow version running on your real documents or data, so decisions are based on something you can try.",
  },
  {
    title: "Test with real cases",
    body: "We measure results against examples from your workflow, fix the failures and agree where a person must approve.",
  },
  {
    title: "Production and handover",
    body: "Deployment in your environment with monitoring and documentation, then a handover or continued support.",
  },
];

export function Process() {
  return (
    <section
      id="how-we-work"
      aria-labelledby="process-heading"
      className="scroll-mt-16 border-b border-line bg-surface"
    >
      <div className="wrap py-20 md:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="eyebrow">How we work</p>
            <h2 id="process-heading" className="section-title mt-5">
              From a scoped problem
              <br />
              to a system in use.
            </h2>
          </div>
          <p className="text-muted lg:col-span-5 lg:col-start-8">
            Engagements can be a fixed-scope project, a production build, or
            continued engineering after launch.
          </p>
        </div>

        <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <li key={stage.title} className="border-t-2 border-foreground pt-5">
              <p className="font-mono text-sm text-accent-text">
                Step {index + 1}
              </p>
              <h3 className="mt-3 text-lg">{stage.title}</h3>
              <p className="mt-2 text-muted">{stage.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
