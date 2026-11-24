import type { ReactNode } from "react";
import { assetUrl } from "@/config/paths";

type Props = {
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalDocument({ title, updated, children }: Props) {
  return (
    <article className="wrap py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-12">
        <header className="lg:col-span-4">
          <p className="eyebrow">Oppuna app · Legal</p>
          <h1 className="mt-5 text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.1]">
            {title}
          </h1>
          <p className="mt-4 text-muted">Last updated: {updated}</p>
          <p className="mt-6 text-sm text-muted">
            <a className="link" href={assetUrl("/oppuna/")}>
              About the Oppuna app
            </a>
          </p>
        </header>
        <div className="prose-doc max-w-[42rem] lg:col-span-8">{children}</div>
      </div>
    </article>
  );
}
