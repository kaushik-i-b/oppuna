import Link from "next/link";
import { HeartHandshake, Stethoscope, Brain } from "lucide-react";
import {
  CATEGORY_CARD_COPY,
  type ProfessionalCategory,
} from "@/data/professionals";

const ICONS: Record<ProfessionalCategory, typeof Stethoscope> = {
  Psychiatrist: Stethoscope,
  "Clinical Psychologist": Brain,
  "Counselling Psychologist": HeartHandshake,
};

export function ProfessionalCategoryCards() {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {CATEGORY_CARD_COPY.map((item) => {
        const Icon = ICONS[item.category];
        return (
          <li key={item.category} className="card h-full">
            <span
              aria-hidden
              className="inline-flex size-11 items-center justify-center rounded-2xl bg-sage-soft text-sage-deep"
            >
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-medium tracking-[-0.02em]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {item.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function ExploreDirectoryButton({ label = "Explore Directory" }: { label?: string }) {
  return (
    <Link className="btn btn-primary" href="/professionals">
      {label}
    </Link>
  );
}
