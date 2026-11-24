import { assetUrl } from "@/config/paths";
import { WorkflowIllustration } from "./WorkflowIllustration";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="border-b border-line">
      <div className="wrap grid items-center gap-12 py-14 md:py-16 lg:grid-cols-12 lg:gap-10 lg:py-16">
        <div className="lg:col-span-6 xl:col-span-6">
          <p className="eyebrow">Oppuna Labs · Engineering studio</p>
          <h1
            id="hero-heading"
            className="mt-6 text-[clamp(2.25rem,4.6vw,3.5rem)] leading-[1.06] tracking-[-0.02em]"
          >
            AI products built
            <br />
            for real work.
          </h1>
          <p className="lede mt-6">
            We design and build AI agents, document workflows, and custom{" "}
            <span className="whitespace-nowrap">software—from</span> the first
            working version to production.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className="btn btn-primary" href={assetUrl("/#contact")}>
              Discuss a Project
            </a>
            <a className="btn btn-secondary" href={assetUrl("/oppuna/")}>
              Explore Oppuna
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-5 xl:col-start-8">
          <WorkflowIllustration />
        </div>
      </div>
    </section>
  );
}
