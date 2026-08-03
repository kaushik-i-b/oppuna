import Link from "next/link";
import { siteConfig } from "@/config/site";
import { BrandImage } from "./BrandImage";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface" data-contact="email-only">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <BrandImage
                path="/brand/icon.png"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-lg"
              />
              <span className="font-display text-lg font-semibold text-sage-deep">
                {siteConfig.name}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {siteConfig.tagline}. A private wellness companion for everyday
              reflection—not a replacement for professional care.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
                Product
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>
                  <Link href="/#features" className="hover:text-sage-deep">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-sage-deep">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/#download" className="hover:text-sage-deep">
                    Download
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
                Legal
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>
                  <Link href="/privacy" className="hover:text-sage-deep">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-sage-deep">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-sage-deep">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
                Contact
              </p>
              <p className="mt-3 text-sm text-muted">
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="hover:text-sage-deep"
                >
                  {siteConfig.supportEmail}
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted">
          Oppuna supports everyday emotional wellness and self-reflection. It
          does not provide medical advice, diagnosis, treatment, or emergency
          assistance. If you feel you may harm yourself or someone else, contact
          local emergency services or a verified crisis-support service
          immediately.
        </p>

        <p className="mt-6 text-xs text-muted">
          © {year} {siteConfig.companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
