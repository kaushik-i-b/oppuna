/**
 * Illustrative document workflow for the hero.
 * Static HTML/CSS only. Every value is example data and labelled as such.
 */

const fields = [
  { label: "Supplier", value: "Example Traders", status: "ok" },
  { label: "Invoice no.", value: "INV-2041", status: "ok" },
  { label: "PO reference", value: "PO-7731", status: "ok" },
  { label: "Total", value: "₹48,250.00", status: "check" },
] as const;

const steps = [
  { title: "Read the PDF", note: "Text and table layout", state: "done" },
  { title: "Extract the fields", note: "4 fields found", state: "done" },
  {
    title: "Check against the purchase order",
    note: "Total differs from PO-7731",
    state: "flag",
  },
  {
    title: "Ask a person to approve",
    note: "Waiting for finance review",
    state: "active",
  },
  { title: "Post to the accounting system", note: "After approval", state: "todo" },
] as const;

function StatusTag({ status }: { status: "ok" | "check" }) {
  return status === "ok" ? (
    <span className="label-mono !text-[0.6875rem] !normal-case !tracking-normal">
      matched
    </span>
  ) : (
    <span className="border border-accent px-1.5 py-0.5 font-mono text-[0.6875rem] text-accent-text">
      check
    </span>
  );
}

export function WorkflowIllustration() {
  return (
    <figure className="wf" aria-labelledby="wf-caption">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <p className="label-mono">Illustrative workflow</p>
        <p className="label-mono">Example data</p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-5 sm:p-5">
        {/* Stylised source document */}
        <div
          className="wf-grid relative hidden border border-line bg-background p-3 sm:block"
          aria-hidden="true"
        >
          <p className="font-mono text-[0.625rem] uppercase tracking-wider text-muted">
            invoice.pdf
          </p>
          <div className="mt-3 h-2 w-3/4 bg-line-strong" />
          <div className="mt-1.5 h-2 w-1/2 bg-line" />
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full bg-line" />
            <div className="h-1.5 w-5/6 bg-line" />
            <div className="h-1.5 w-full bg-line" />
            <div className="h-1.5 w-2/3 bg-line" />
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full bg-line" />
            <div className="h-1.5 w-full bg-line" />
          </div>
          <div className="mt-4 ml-auto h-3 w-1/2 outline outline-2 outline-offset-2 outline-accent bg-line-strong" />
        </div>

        {/* Extracted fields */}
        <div>
          <p className="font-display text-sm font-semibold">Extracted fields</p>
          <dl className="mt-2 grid gap-1.5">
            {fields.map((field) => (
              <div key={field.label} className="wf-field">
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{field.label}</dt>
                  <dd className="truncate font-mono text-[0.8125rem] text-foreground">
                    {field.value}
                  </dd>
                </div>
                <StatusTag status={field.status} />
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-t border-line p-4 sm:px-5">
        <p className="font-display text-sm font-semibold">Steps</p>
        <ol className="mt-3">
          {steps.map((step, index) => (
            <li key={step.title} className="wf-step">
              <span
                className="wf-node"
                data-state={step.state === "active" ? "active" : undefined}
                aria-hidden="true"
              >
                {step.state === "done" ? "✓" : step.state === "flag" ? "!" : index + 1}
              </span>
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 pt-0.5 leading-snug">
                <p className="text-[0.9375rem] font-semibold text-foreground">
                  {step.title}
                </p>
                <p
                  className={`text-sm ${step.state === "flag" ? "text-accent-text" : "text-muted"}`}
                >
                  <span className="sr-only">
                    {step.state === "done"
                      ? "Done. "
                      : step.state === "flag"
                        ? "Flagged. "
                        : step.state === "active"
                          ? "Current step. "
                          : "Not started. "}
                  </span>
                  {step.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <figcaption
        id="wf-caption"
        className="border-t border-line px-4 py-3 text-sm text-muted"
      >
        An example of a supplier-invoice workflow, for illustration only. It is
        not a live system or a customer result.
      </figcaption>
    </figure>
  );
}
