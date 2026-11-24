import { assetUrl } from "@/config/paths";
import { siteConfig } from "@/config/site";
import { LabsWordmark } from "./LabsWordmark";

type FooterLink = { href: string; label: string; external?: boolean };

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: readonly FooterLink[];
}) {
  return (
    <div>
      <h2 className="font-display text-sm font-semibold text-foreground">
        {heading}
      </h2>
      <ul className="mt-3">
        {links.map((item) => (
          <li key={item.href}>
            <a
              className="inline-flex min-h-10 items-center text-[0.9375rem] text-muted transition-colors hover:text-foreground"
              href={item.external ? item.href : assetUrl(item.href)}
              {...(item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { footerNav, winfin } = siteConfig;

  return (
    <footer className="border-t border-line bg-surface">
      <div className="wrap py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <a href={assetUrl("/")} aria-label="Oppuna Labs home">
              <LabsWordmark />
            </a>
            <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-muted">
              Engineering services for AI agents, document workflows and
              custom software. Oppuna Labs also builds the Oppuna app.
            </p>
            <p className="mt-4 text-[0.9375rem]">
              <a className="link" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8"
          >
            <FooterColumn heading="Oppuna Labs" links={footerNav.labs} />
            <FooterColumn
              heading="Oppuna app"
              links={[
                ...footerNav.app,
                {
                  href: siteConfig.googlePlayUrl,
                  label: "Google Play",
                  external: true,
                },
              ]}
            />
            <FooterColumn
              heading="Company"
              links={[
                ...footerNav.company,
                { href: siteConfig.githubUrl, label: "GitHub", external: true },
              ]}
            />
          </nav>
        </div>

        <div className="mt-12 grid gap-4 border-t border-line pt-6 text-sm leading-relaxed text-muted md:grid-cols-12">
          <p className="md:col-span-4">
            {winfin.copyright}
            <br />
            {winfin.location}
          </p>
          <p className="md:col-span-8">
            Oppuna provides AI-assisted mental wellness tools and informational
            resources. It does not replace professional medical advice,
            diagnosis, or treatment. If you are experiencing an emergency,
            contact local emergency services.
          </p>
        </div>
      </div>
    </footer>
  );
}
