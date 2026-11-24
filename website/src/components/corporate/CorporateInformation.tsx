import { siteConfig } from "@/config/site";
import { BrandImage } from "@/components/BrandImage";

type Props = {
  headingId?: string;
};

export function CorporateInformation({
  headingId = "corporate-information-heading",
}: Props) {
  const { winfin } = siteConfig;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="label-mono">
        Corporate information
      </h2>
      <p className="mt-3 font-display text-lg font-semibold">
        {winfin.productLine}
      </p>

      <div className="mt-6 grid gap-6 border-t border-foreground pt-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="self-start border border-line bg-white p-3">
          <BrandImage
            path="/brand/winfin-logo.jpg"
            alt="Winfin"
            width={632}
            height={378}
            className="h-auto w-full"
          />
        </div>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Company</dt>
            <dd className="mt-1 font-semibold">{winfin.legalName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">CIN</dt>
            <dd className="mt-1 break-all font-mono text-sm">{winfin.cin}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Location</dt>
            <dd className="mt-1 font-semibold">{winfin.location}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Website</dt>
            <dd className="mt-1">
              <a className="link break-all" href={winfin.website}>
                {winfin.website}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
