import { assetUrl } from "@/config/paths";

export default function NotFound() {
  return (
    <div className="wrap py-20 md:py-28">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-5 text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.1]">
        This page is not on the site.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        The address may be out of date. The Oppuna Labs homepage and the
        Oppuna app page are still available.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a className="btn btn-primary" href={assetUrl("/")}>
          Oppuna Labs home
        </a>
        <a className="btn btn-secondary" href={assetUrl("/oppuna/")}>
          The Oppuna app
        </a>
      </div>
    </div>
  );
}
