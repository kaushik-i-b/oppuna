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
    <section aria-labelledby={headingId} className="space-y-6">
      <div className="max-w-3xl">
        <h2 id={headingId} className="text-2xl font-medium tracking-[-0.03em]">
          Corporate Information
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{winfin.productLine}</p>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="rounded-2xl bg-white p-4">
          <BrandImage
            path="/brand/winfin-logo.jpg"
            alt="Winfin"
            width={632}
            height={378}
            className="h-auto w-full"
          />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Company</dt>
            <dd className="mt-1 font-medium">{winfin.legalName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">CIN</dt>
            <dd className="mt-1 break-all font-mono text-sm">{winfin.cin}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Location</dt>
            <dd className="mt-1 font-medium">{winfin.location}</dd>
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
