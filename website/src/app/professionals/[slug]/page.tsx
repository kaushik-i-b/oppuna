import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/professionals/ProfessionalCard";
import { absoluteUrl } from "@/config/site";
import {
  PROFESSIONALS,
  getProfessionalBySlug,
  type Professional,
} from "@/data/professionals";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROFESSIONALS.map((profile) => ({ slug: profile.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

function profileMetadata(profile: Professional): Metadata {
  return {
    title: `${profile.name} — Demonstration Profile | Oppuna`,
    description: `Fictional demonstration profile for ${profile.name} (${profile.category}). Not a real practitioner or available service.`,
    alternates: { canonical: absoluteUrl(`/professionals/${profile.slug}`) },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfessionalBySlug(slug);
  if (!profile) return {};
  return profileMetadata(profile);
}

export default async function ProfessionalDetailPage({ params }: Props) {
  const { slug } = await params;
  const profile = getProfessionalBySlug(slug);
  if (!profile) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="eyebrow">Professional Directory Preview</p>
      <div className="mt-4 flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-sage-soft text-2xl font-semibold text-sage-deep"
        >
          {profile.initials}
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-medium tracking-[-0.03em] md:text-4xl">
            {profile.name}
          </h1>
          <p className="mt-1 text-sage">{profile.category}</p>
        </div>
      </div>

      <div className="mt-5">
        <DemoBadge />
      </div>

      <p
        role="note"
        className="mt-5 rounded-2xl border border-sage/40 bg-sage-soft/40 p-4 text-sm leading-relaxed"
      >
        <strong className="font-semibold">
          Demonstration profile.
        </strong>{" "}
        All information on this page is fictional and created to preview
        Oppuna&apos;s upcoming professional directory. This person is not a
        real practitioner and these are not available services.
      </p>

      <section aria-labelledby="about-heading" className="mt-10">
        <h2 id="about-heading" className="text-xl font-medium">
          About
        </h2>
        <p className="mt-2 leading-relaxed text-muted">{profile.biography}</p>
      </section>

      <section aria-labelledby="approach-heading" className="mt-8">
        <h2 id="approach-heading" className="text-xl font-medium">
          Professional approach
        </h2>
        <p className="mt-2 leading-relaxed text-muted">{profile.approach}</p>
      </section>

      <section aria-labelledby="focus-heading" className="mt-8">
        <h2 id="focus-heading" className="text-xl font-medium">
          Areas of focus
        </h2>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {profile.specializations.map((item) => (
            <li
              key={item}
              className="rounded-full border border-line bg-black/20 px-3 py-1.5 font-mono text-xs"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="languages-heading" className="mt-8">
        <h2 id="languages-heading" className="text-xl font-medium">
          Languages
        </h2>
        <p className="mt-2 leading-relaxed text-muted">
          {profile.languages.join(" · ")}
        </p>
      </section>

      <section aria-labelledby="verification-heading" className="mt-8">
        <h2 id="verification-heading" className="text-xl font-medium">
          Verification status
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Demonstration record — not verified. Provider qualifications,
          registration, and scope of practice must be verified before
          onboarding real professionals. No verification badges are shown for
          demonstration profiles.
        </p>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted">
        Oppuna provides AI-assisted mental wellness tools and informational
        resources. It does not replace professional medical advice, diagnosis,
        or treatment. If you are experiencing an emergency, contact local
        emergency services.
      </p>

      <p className="mt-8">
        <Link
          href="/professionals"
          className="btn btn-secondary !px-5 !py-2.5 text-sm"
        >
          ← Back to directory
        </Link>
      </p>
    </article>
  );
}
