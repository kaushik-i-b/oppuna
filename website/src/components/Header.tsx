"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { siteConfig } from "@/config/site";

function LabsMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M11 21.5v-11M11 21.5h10M11 15.5h7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="21.5" r="2" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg"
          onClick={() => setOpen(false)}
          aria-label="Oppuna Labs home"
        >
          <LabsMark className="size-8 text-accent" />
          <span className="text-lg font-semibold tracking-tight">
            Oppuna&nbsp;Labs
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-muted lg:flex"
          aria-label="Primary"
        >
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white"
          >
            Discuss a Project
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-foreground lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="border-t border-line bg-surface px-5 py-5 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-base font-medium hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <Link
              href="/#contact"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-6 py-3 text-[0.95rem] font-semibold text-black"
              onClick={() => setOpen(false)}
            >
              Discuss a Project
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
