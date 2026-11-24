import { GooglePlayButton } from "@/components/GooglePlayButton";
import { PhonePreview } from "@/components/PhonePreview";
import { assetUrl } from "@/config/paths";
import { siteConfig } from "@/config/site";

/** Verified against the app source (src/screens, app.json). */
const features = [
  {
    title: "Journal",
    body: "Daily, gratitude, thought-record, trigger and free-note entries.",
  },
  {
    title: "Mood check-ins",
    body: "Log mood, intensity, notes and tags, then review weekly patterns.",
  },
  {
    title: "A daily plan",
    body: "Short activities for breathing, grounding and winding down for sleep.",
  },
  {
    title: "A companion on your phone",
    body: "Supportive chat from a language model that runs on the device.",
  },
];

const privacyFacts = [
  "No account to create",
  "Entries are stored on your device",
  "Release builds block internet access",
  "Optional app lock, export and delete",
];

export function ProductShowcase() {
  return (
    <section
      id="oppuna"
      aria-labelledby="oppuna-heading"
      className="section-dark scroll-mt-16"
    >
      <div className="wrap grid gap-14 py-20 md:py-24 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="eyebrow">Our product · Android</p>
          <h2
            id="oppuna-heading"
            className="mt-6 text-[clamp(2rem,3.8vw,3rem)] leading-[1.08] tracking-[-0.018em]"
          >
            Oppuna.
            <br />
            A private space to reflect.
          </h2>
          <p className="lede mt-6">
            Oppuna is a wellness app for journaling, mood check-ins and a
            calm daily routine. It works without an account, and what you
            write stays on your phone.
          </p>

          <ul className="mt-10 grid border-t border-line sm:grid-cols-2">
            {features.map((feature, index) => (
              <li
                key={feature.title}
                className={`border-b border-line py-5 sm:pr-8 ${index % 2 === 1 ? "sm:border-l sm:pl-8 sm:pr-0" : ""}`}
              >
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>

          <ul
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]"
            aria-label="Privacy at a glance"
          >
            {privacyFacts.map((fact) => (
              <li key={fact} className="flex items-center gap-2.5">
                <span aria-hidden className="size-1.5 bg-accent-text" />
                {fact}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a className="btn btn-primary" href={assetUrl("/oppuna/")}>
              Explore the App
            </a>
            <GooglePlayButton variant="secondary" />
          </div>

          <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
            Oppuna is a wellness and self-help tool. It is not therapy, a
            medical device or an emergency service.{" "}
            {siteConfig.winfin.productStatement}
          </p>
        </div>

        <div className="flex items-center lg:col-span-4 lg:col-start-9">
          <PhonePreview />
        </div>
      </div>
    </section>
  );
}
