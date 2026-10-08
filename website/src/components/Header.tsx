"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { assetUrl } from "@/config/paths";
import { siteConfig } from "@/config/site";
import { BrandImage } from "./BrandImage";

export function Header() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const renderLinks = (className: string) =>
    siteConfig.nav.map((item) => (
      <a
        key={item.href}
        href={assetUrl(item.href)}
        className={className}
        onClick={() => setOpen(false)}
      >
        {item.label}
      </a>
    ));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[color-mix(in_srgb,var(--bg)_84%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <a
          href={assetUrl("/")}
          className="flex items-center gap-2.5 rounded-lg"
          onClick={() => setOpen(false)}
        >
          <BrandImage
            path="/brand/icon.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-lg"
            priority
          />
          <span className="whitespace-nowrap text-[1.05rem] font-medium tracking-[-0.03em]">
            Oppuna Labs
          </span>
        </a>

        <nav className="hidden items-center gap-5 text-sm lg:flex" aria-label="Primary">
          {renderLinks(
            "rounded-lg text-muted transition-colors hover:text-foreground",
          )}
        </nav>

        <a
          className="btn btn-primary hidden !px-4 !py-2 text-sm lg:inline-flex"
          href={assetUrl("/#contact")}
        >
          Discuss a Project
        </a>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-line text-foreground lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="max-h-[calc(100dvh-4.25rem)] overflow-auto border-t border-line bg-background px-5 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-1 text-base" aria-label="Mobile">
            {renderLinks(
              "rounded-lg px-2 py-3 text-muted transition-colors hover:text-foreground",
            )}
          </nav>
          <a
            className="btn btn-primary mt-4 w-full"
            href={assetUrl("/#contact")}
            onClick={() => setOpen(false)}
          >
            Discuss a Project
          </a>
        </div>
      ) : null}
    </header>
  );
}
