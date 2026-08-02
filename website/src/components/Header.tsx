"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { siteConfig } from "@/config/site";
import { GooglePlayButton } from "./GooglePlayButton";

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
    <header className="sticky top-0 z-50 border-b border-line/80 bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/brand/icon.png"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-xl"
            priority
          />
          <span className="font-display text-xl font-semibold tracking-tight text-sage-deep">
            {siteConfig.name}
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
              className="transition-colors hover:text-sage-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <GooglePlayButton className="!px-5 !py-2.5 !text-sm" />
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-sage-deep lg:hidden"
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
                className="rounded-xl px-3 py-3 text-base font-medium text-sage-deep hover:bg-sage-soft/50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <GooglePlayButton className="w-full" />
          </div>
        </div>
      ) : null}
    </header>
  );
}
