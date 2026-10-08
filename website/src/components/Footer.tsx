import { assetUrl } from "@/config/paths";
import { siteConfig } from "@/config/site";
import { BrandImage } from "./BrandImage";

export function Footer() {
  return (
    <footer className="border-t border-line" aria-label="Footer">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <a href={assetUrl("/")} className="inline-flex items-center gap-2.5">
              <BrandImage
                path="/brand/icon.png"
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-md"
              />
              <span className="text-lg font-medium tracking-[-0.03em]">
                Oppuna Labs
              </span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {siteConfig.tagline}
            </p>
            <p className="mt-4 text-sm text-muted">
              <a className="link" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
              {siteConfig.footerNav.map((item) => (
                <li key={item.href}>
                  <a className="text-muted hover:text-foreground" href={assetUrl(item.href)}>
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  className="text-muted hover:text-foreground"
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Oppuna Labs. All rights reserved.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a className="hover:text-foreground" href={assetUrl("/oppuna/")}>
              Oppuna
            </a>
            <a className="hover:text-foreground" href={assetUrl("/privacy/")}>
              Privacy
            </a>
            <a className="hover:text-foreground" href={assetUrl("/terms/")}>
              Terms
            </a>
            <a className="hover:text-foreground" href={assetUrl("/support/")}>
              Support
            </a>
          </p>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
          Oppuna, the wellness application, supports everyday reflection. It
          does not provide medical advice, diagnosis, treatment, or emergency
          assistance.
        </p>
      </div>
    </footer>
  );
}
