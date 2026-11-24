"use client";

import { useEffect, useId, useRef, useState } from "react";
import { assetUrl } from "@/config/paths";
import { siteConfig } from "@/config/site";
import { LabsWordmark } from "./LabsWordmark";

export function Header() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background">
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <a
          href={assetUrl("/")}
          className="-m-1 p-1"
          onClick={close}
          aria-label="Oppuna Labs home"
        >
          <LabsWordmark />
        </a>

        <nav className="hidden lg:block" aria-label="Primary">
          <ul className="flex items-center gap-1">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={assetUrl(item.href)}
                  className="inline-flex min-h-11 items-center px-3 font-display text-[0.9375rem] font-medium text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          className="btn btn-primary hidden !min-h-10 !px-4 !py-2 lg:inline-flex"
          href={assetUrl("/#contact")}
        >
          Discuss a Project
        </a>

        <button
          ref={buttonRef}
          type="button"
          className="inline-flex min-h-11 items-center gap-2 border border-line-strong px-3 font-display text-sm font-semibold lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden className="relative block h-3 w-4">
            <span
              className={`absolute left-0 h-[1.5px] w-4 bg-foreground transition-transform duration-150 ${open ? "top-1/2 rotate-45" : "top-0"}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] w-4 bg-foreground transition-transform duration-150 ${open ? "bottom-auto top-1/2 -rotate-45" : ""}`}
            />
          </span>
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div
        id={panelId}
        hidden={!open}
        className="h-[calc(100dvh-4rem)] overflow-auto border-t border-line bg-background lg:hidden"
      >
        <nav className="wrap py-4" aria-label="Mobile">
          <ul className="divide-y divide-line border-b border-line">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={assetUrl(item.href)}
                  className="flex min-h-14 items-center font-display text-lg font-medium"
                  onClick={close}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            className="btn btn-primary mt-6 w-full"
            href={assetUrl("/#contact")}
            onClick={close}
          >
            Discuss a Project
          </a>
        </nav>
      </div>
    </header>
  );
}
