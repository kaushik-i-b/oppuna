import Link from "next/link";
import { ProfessionalCategoryCard } from "@/components/directory/ProfessionalCategoryCard";
import { directoryCopy } from "@/content/directory";
import { Section } from "./Section";

const cards = [
  directoryCopy.categories.psychiatrist,
  directoryCopy.categories["clinical-psychologist"],
  directoryCopy.categories["counselling-psychologist"],
] as const;

export function DirectoryPreview() {
  return (
    <Section
      id="professionals"
      eyebrow={directoryCopy.previewLabel}
      headingId="directory-preview-heading"
      title={directoryCopy.homeHeading}
      intro={<p>{directoryCopy.homeDescription}</p>}
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.title} className="min-w-0">
            <ProfessionalCategoryCard
              title={card.title}
              description={card.homeSummary}
            />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link className="btn btn-primary min-h-11" href="/professionals">
          {directoryCopy.exploreDirectory}
        </Link>
      </div>
    </Section>
  );
}
