import Link from "next/link";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/#solutions", label: "Solutions" },
  { href: "/#products", label: "Products" },
  { href: "/#engineering", label: "Engineering" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-semibold tracking-tight">Oppuna Labs</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              AI systems that solve real business problems.
            </p>
            <p className="mt-4 text-sm text-muted">
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/#products" className="hover:text-foreground">
                  Oppuna — wellness app
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-foreground">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Oppuna Labs. All rights reserved.</p>
          <p>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <span aria-hidden="true"> · </span>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="hover:text-foreground"
            >
              {siteConfig.supportEmail}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
