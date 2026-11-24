import { assetUrl } from "@/config/paths";
import { siteConfig } from "@/config/site";

const principles = [
  {
    title: "The people who scope it build it",
    body: "Architecture and implementation are not split across account managers and separate teams.",
  },
  {
    title: "Model choice follows the problem",
    body: "We pick models and hosting for each workflow rather than fitting every task to one provider.",
  },
  {
    title: "Tested before it is trusted",
    body: "Evaluation, logging and human approval are planned from the start, not added after launch.",
  },
];

export function About() {
  const { winfin } = siteConfig;

  const brands = [
    {
      name: winfin.legalName,
      role: "The company",
      body: `An Indian technology company based in ${winfin.location}.`,
    },
    {
      name: "Oppuna Labs",
      role: "Engineering services",
      body: "Designs and builds AI agents, document workflows and custom software for clients.",
    },
    {
      name: "Oppuna",
      role: "Wellness app",
      body: "A private journaling and mental-wellness app for Android.",
    },
  ];

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-16 border-b border-line"
    >
      <div className="wrap grid gap-14 py-20 md:py-28 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow">About</p>
          <h2 id="about-heading" className="section-title mt-5">
            An engineering studio
            <br />
            that ships its own product.
          </h2>
          <p className="mt-6 text-muted">
            Oppuna Labs builds software for clients, and it built Oppuna. Work
            on our own app keeps us close to the details that decide whether
            software is useful: privacy, reliability and how people actually
            use it.
          </p>

          <ul className="mt-10 space-y-6">
            {principles.map((item) => (
              <li key={item.title} className="border-l-2 border-accent pl-4">
                <h3 className="text-base">{item.title}</h3>
                <p className="mt-1 text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <h3 className="label-mono">How the names fit together</h3>
          <dl className="mt-4 border-t border-foreground">
            {brands.map((brand) => (
              <div
                key={brand.name}
                className="grid gap-1 border-b border-line py-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
              >
                <dt className="text-sm text-muted">{brand.role}</dt>
                <dd>
                  <p className="font-display font-semibold">{brand.name}</p>
                  <p className="mt-1 text-muted">{brand.body}</p>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6">
            <a className="link" href={assetUrl("/about/")}>
              Company details for Oppuna and Winfin Technologies
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
