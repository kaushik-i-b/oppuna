import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title: string;
  headingId: string;
  intro?: ReactNode;
  children: ReactNode;
  tone?: "default" | "band";
};

export function Section({
  id,
  eyebrow,
  title,
  headingId,
  intro,
  children,
  tone = "default",
}: Props) {
  const toneClass =
    tone === "band"
      ? "border-y border-line bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]"
      : "";

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`scroll-mt-24 ${toneClass}`}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-3xl">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId} className={`section-title ${eyebrow ? "mt-3" : ""}`}>
            {title}
          </h2>
          {intro ? (
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted">
              {intro}
            </div>
          ) : null}
        </div>
        <div className="mt-12 md:mt-14">{children}</div>
      </div>
    </section>
  );
}
