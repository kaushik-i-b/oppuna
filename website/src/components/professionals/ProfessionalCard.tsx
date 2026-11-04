import Link from "next/link";
import type { Professional } from "@/data/professionals";
import { professionalDetailPath } from "@/data/professionals";

type Props = {
  profile: Professional;
};

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-sage/40 bg-sage-soft px-2.5 py-1 font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-sage">
      Demo Profile
    </span>
  );
}

export function ProfessionalCard({ profile }: Props) {
  return (
    <article className="card flex h-full flex-col" aria-label={profile.name}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-lg font-semibold text-sage-deep"
        >
          {profile.initials}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-medium tracking-[-0.02em]">
            {profile.name}
          </h3>
          <p className="mt-0.5 text-sm text-sage">{profile.category}</p>
        </div>
      </div>

      <div className="mt-4">
        <DemoBadge />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        {profile.description}
      </p>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Languages
        </p>
        <p className="mt-1 text-sm">{profile.languages.join(" · ")}</p>
      </div>

      <ul
        className="mt-3 flex flex-wrap gap-1.5"
        aria-label={`Areas of support for ${profile.name}`}
      >
        {profile.specializations.map((item) => (
          <li
            key={item}
            className="rounded-full border border-line bg-black/20 px-2.5 py-1 font-mono text-xs"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        <Link
          className="btn btn-secondary w-full !px-4 !py-2.5 text-sm"
          href={professionalDetailPath(profile)}
          aria-label={`View informational profile for ${profile.name} (demonstration)`}
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}
