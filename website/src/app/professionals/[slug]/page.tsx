import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalProfile } from "@/components/directory/ProfessionalProfile";
import { absoluteUrl } from "@/config/site";
import {
  getProfessionalBySlug,
  professionals,
  categoryLabels,
} from "@/data/professionals";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return professionals.map((profile) => ({ slug: profile.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfessionalBySlug(slug);
  if (!profile) {
    return { robots: { index: false, follow: false } };
  }

  const title = `${profile.name} · Demonstration profile | Oppuna`;
  const description = `Fictional demonstration profile for a preview of the Oppuna directory. ${profile.name} is not a real or available practitioner.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(`/professionals/${profile.slug}`) },
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/professionals/${profile.slug}`),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const profile = getProfessionalBySlug(slug);
  if (!profile) notFound();

  return (
    <>
      <p className="sr-only">
        {categoryLabels[profile.category]} demonstration profile
      </p>
      <ProfessionalProfile profile={profile} />
    </>
  );
}
