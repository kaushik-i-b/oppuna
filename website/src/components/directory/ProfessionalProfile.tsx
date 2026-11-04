import Link from "next/link";
import { directoryCopy } from "@/content/directory";
import {
  categoryLabels,
  isPubliclyVerified,
  type Professional,
} from "@/data/professionals";
import { siteConfig } from "@/config/site";
import { DirectoryDisclaimer } from "./DirectoryDisclaimer";
import { ProfessionalAvatar } from "./ProfessionalAvatar";

type Props = {
  profile: Professional;
};

export function ProfessionalProfile({ profile }: Props) {
  const verified = isPubliclyVerified(profile);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p>
        <Link href="/professionals" className="link text-sm">
          ← {directoryCopy.backToDirectory}
        </Link>
      </p>

      <div className="mt-8">
        <DirectoryDisclaimer id={`demo-notice-${profile.slug}`} />
      </div>

      <header className="mt-8 flex items-start gap-4">
        <ProfessionalAvatar id={profile.avatar} className="size-20 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-sage">
            {directoryCopy.demoBadge}
          </p>
          <h1 className="mt-2 break-words text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.04em]">
            {profile.name}
          </h1>
          <p className="mt-2 text-lg text-muted">{categoryLabels[profile.category]}</p>
        </div>
      </header>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        {directoryCopy.profileFiction}
      </p>

      <dl className="mt-8 space-y-6">
        <div>
          <dt className="text-sm font-medium">{directoryCopy.languagesLabel}</dt>
          <dd className="mt-2 text-muted">{profile.languages.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">{directoryCopy.focusLabel}</dt>
          <dd>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.focusAreas.map((area) => (
                <li
                  key={area.id}
                  className="max-w-full break-words rounded-full border border-line px-3 py-1.5 text-sm"
                >
                  {area.label}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <section className="mt-10" aria-labelledby="biography-heading">
        <h2 id="biography-heading" className="text-2xl font-medium tracking-[-0.03em]">
          {directoryCopy.biographyLabel}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">{profile.biography}</p>
        <p className="mt-3 leading-relaxed text-muted">{profile.description}</p>
      </section>

      <section className="mt-10" aria-labelledby="approach-heading">
        <h2 id="approach-heading" className="text-2xl font-medium tracking-[-0.03em]">
          {directoryCopy.approachLabel}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">{profile.approach}</p>
      </section>

      <section className="mt-10" aria-labelledby="status-heading">
        <h2 id="status-heading" className="text-2xl font-medium tracking-[-0.03em]">
          {directoryCopy.statusLabel}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">{directoryCopy.statusBody}</p>
        {verified && profile.credentials ? (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Verified credentials</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {profile.credentials.qualifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {profile.credentials.registrations.map((item) => (
                <li key={`${item.body}-${item.number}`}>
                  {item.body}: {item.number}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <aside className="card mt-10" role="note">
        <p className="leading-relaxed text-muted">{directoryCopy.disclaimer}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {directoryCopy.indiaResourcesLead}{" "}
          <a className="link" href="tel:112">
            112
          </a>
          , Tele-MANAS{" "}
          <a className="link" href="tel:14416">
            14416
          </a>{" "}
          and{" "}
          <a className="link" href="tel:18008914416">
            1800-89-14416
          </a>
          .{" "}
          <a
            className="link"
            href={siteConfig.officialSources.teleManasProgramme}
            target="_blank"
            rel="noopener noreferrer"
          >
            MoHFW / DGHS
          </a>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {directoryCopy.privacyNote}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {directoryCopy.noAvailability}
        </p>
      </aside>
    </article>
  );
}
