import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
};

export function SectionHeading({ eyebrow, title, lead, id }: Props) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <h2
        {...(id ? { id } : {})}
        className="mt-3 font-display text-[clamp(1.9rem,4.5vw,2.9rem)] font-semibold leading-[1.08] tracking-tight"
      >
        {title}
      </h2>
      {lead ? (
        <p className="mt-4 text-lg leading-relaxed text-muted">{lead}</p>
      ) : null}
    </div>
  );
}
