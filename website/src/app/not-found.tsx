import { assetUrl } from "@/config/paths";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-24 md:px-8">
      <p className="eyebrow">404</p>
      <h1 className="section-title mt-3">This page is not on the site.</h1>
      <p className="mt-4 text-lg text-muted">
        The address may be out of date. The Oppuna Labs homepage and the
        Oppuna product page are still available.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a className="btn btn-primary" href={assetUrl("/")}>
          Oppuna Labs
        </a>
        <a className="btn btn-secondary" href={assetUrl("/oppuna/")}>
          Explore Oppuna
        </a>
      </div>
    </div>
  );
}
