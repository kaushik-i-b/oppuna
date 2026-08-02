import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalDocument({ title, updated, children }: Props) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
        Legal
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-sage-deep">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted">Last updated: {updated}</p>
      <div className="prose-legal mt-10 space-y-6 text-[1.02rem] leading-relaxed text-muted [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-sage-deep [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-sage-deep [&_strong]:text-sage-deep [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-semibold [&_a]:text-sage-deep [&_a]:underline">
        {children}
      </div>
      <p className="mt-12 text-sm text-muted">
        <Link href="/" className="font-semibold text-sage-deep hover:underline">
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
