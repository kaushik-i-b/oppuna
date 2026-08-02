import { siteConfig } from "@/config/site";

export function ResponsibleUse() {
  return (
    <section
      id="responsible-use"
      className="scroll-mt-24"
      aria-labelledby="responsible-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="rounded-[2rem] border border-line bg-[linear-gradient(145deg,#fff_0%,#eef4f0_100%)] p-7 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
            Responsible use
          </p>
          <h2
            id="responsible-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep"
          >
            Supportive—not clinical
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
            Oppuna supports everyday emotional wellness and self-reflection. It
            does not provide medical advice, diagnosis, treatment, or emergency
            assistance.
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted">
            If you feel you may harm yourself or someone else, contact local
            emergency services or a verified crisis-support service immediately.
          </p>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-sage-deep">
              India support resources
            </h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {siteConfig.crisisIndia.map((line) => (
                <li
                  key={line.phone}
                  className="rounded-2xl border border-line bg-surface px-4 py-3"
                >
                  <p className="text-sm font-semibold text-sage-deep">
                    {line.label}
                  </p>
                  <a
                    href={`tel:${line.phone}`}
                    className="mt-1 inline-block font-display text-lg text-sage underline-offset-4 hover:underline"
                  >
                    {line.display}
                  </a>
                  <p className="mt-1 text-xs text-muted">{line.detail}</p>
                  <p className="mt-2 text-xs">
                    <a
                      href={line.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sage-deep underline underline-offset-2"
                    >
                      {line.sourceLabel}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Helpline numbers can change. Prefer official government channels
              when possible, and always dial local emergency services if you are
              in immediate danger.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
