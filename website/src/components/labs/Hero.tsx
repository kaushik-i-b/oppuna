import { assetUrl } from "@/config/paths";

const capabilities = [
  "Agents",
  "RAG",
  "Automation",
  "Voice AI",
  "Document Intelligence",
  "Custom AI Products",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        <p className="eyebrow">AI product engineering</p>
        <h1
          id="hero-heading"
          className="mt-5 max-w-5xl text-[clamp(2.7rem,7.2vw,5.35rem)] font-medium leading-[1.02] tracking-[-0.045em] text-balance"
        >
          AI systems that solve real business problems.
        </h1>
        <div className="mt-7 max-w-2xl space-y-4 text-lg leading-relaxed text-muted">
          <p>
            Oppuna Labs designs and builds production-grade AI agents,
            intelligent automation, enterprise knowledge systems and custom AI
            products.
          </p>
          <p>
            We work from problem definition through architecture,
            implementation, integration and production deployment.
          </p>
        </div>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a className="btn btn-primary" href={assetUrl("/#contact")}>
            Discuss a Project
          </a>
          <a className="btn btn-secondary" href={assetUrl("/#solutions")}>
            Explore Our Capabilities
          </a>
        </div>
        <ul className="credibility" aria-label="Capabilities">
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
