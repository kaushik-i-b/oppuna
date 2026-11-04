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
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {siteConfig.winfin.productStatement}
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
              {siteConfig.footerNav.map((item) => (
                <li key={item.href}>
                  <a
                    className="inline-flex min-h-11 items-center text-muted hover:text-foreground"
                    href={assetUrl(item.href)}
                  >
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

        <div className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>{siteConfig.winfin.copyright}</p>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
          Oppuna provides AI-assisted mental wellness tools and informational
          resources. It does not replace professional medical advice, diagnosis,
          or treatment. If you are experiencing an emergency, contact local
          emergency services.
        </p>
      </div>
    </footer>
  );
}
