import { DEMO_NOTICE, WELLNESS_DISCLAIMER } from "@/data/professionals";

export function DirectoryDisclaimer() {
  return (
    <div className="space-y-3">
      <p
        role="note"
        aria-label="Demonstration directory notice"
        className="rounded-2xl border border-sage/40 bg-sage-soft/40 p-4 text-sm leading-relaxed sm:p-5 sm:text-base"
      >
        <strong className="font-semibold">Professional Directory Preview. </strong>
        {DEMO_NOTICE}
      </p>
      <p className="text-xs leading-relaxed text-muted sm:text-sm">
        {WELLNESS_DISCLAIMER}
      </p>
    </div>
  );
}
