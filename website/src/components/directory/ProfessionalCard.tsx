import Link from "next/link";
import { directoryCopy } from "@/content/directory";
import { categoryLabels, type Professional } from "@/data/professionals";
import { ProfessionalAvatar } from "./ProfessionalAvatar";

type Props = {
  profile: Professional;
};

export function ProfessionalCard({ profile }: Props) {
  return (
    <article className="card flex h-full min-w-0 flex-col">
      <div className="flex items-start gap-4">
        <ProfessionalAvatar id={profile.avatar} className="size-16 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-sage">
            {directoryCopy.demoBadge}
          </p>
          <h3 className="mt-1 break-words text-xl font-medium tracking-[-0.03em]">
            {profile.name}
          </h3>
          <p className="mt-1 text-sm text-muted">{categoryLabels[profile.category]}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        <span className="text-foreground">{directoryCopy.languagesLabel}: </span>
        {profile.languages.join(", ")}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label={directoryCopy.focusLabel}>
        {profile.focusAreas.map((area) => (
          <li
            key={area.id}
            className="max-w-full break-words rounded-full border border-line px-2.5 py-1 text-xs leading-snug text-foreground"
          >
            {area.label}
          </li>
        ))}
      </ul>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
        {profile.description}
      </p>

      <Link
        href={`/professionals/${profile.slug}`}
        className="btn btn-secondary mt-5 w-full"
      >
        {directoryCopy.viewProfile}
        <span className="sr-only">
          {" "}
          {directoryCopy.viewProfileOf} {profile.name}
        </span>
      </Link>
    </article>
  );
}
