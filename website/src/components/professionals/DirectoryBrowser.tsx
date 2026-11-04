"use client";

import { useMemo, useState } from "react";
import {
  LANGUAGES,
  SPECIALIZATIONS,
  type Professional,
  type ProfessionalCategory,
} from "@/data/professionals";
import { ProfessionalCard } from "./ProfessionalCard";

type Props = {
  profiles: Professional[];
};

const ALL = "all";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: ALL, label: "All Professionals" },
  { value: "Psychiatrist", label: "Psychiatrists" },
  { value: "Clinical Psychologist", label: "Clinical Psychologists" },
  { value: "Counselling Psychologist", label: "Counselling Psychologists" },
];

function matchesQuery(profile: Professional, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    profile.name,
    profile.category,
    ...profile.languages,
    ...profile.specializations,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function DirectoryBrowser({ profiles }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProfessionalCategory | typeof ALL>(
    ALL,
  );
  const [language, setLanguage] = useState<string>(ALL);
  const [specialization, setSpecialization] = useState<string>(ALL);

  const hasActiveFilters =
    query.trim() !== "" ||
    category !== ALL ||
    language !== ALL ||
    specialization !== ALL;

  const results = useMemo(
    () =>
      profiles.filter((profile) => {
        if (category !== ALL && profile.category !== category) return false;
        if (language !== ALL && !profile.languages.includes(language))
          return false;
        if (
          specialization !== ALL &&
          !profile.specializations.includes(specialization)
        )
          return false;
        return matchesQuery(profile, query);
      }),
    [profiles, query, category, language, specialization],
  );

  function clearFilters() {
    setQuery("");
    setCategory(ALL);
    setLanguage(ALL);
    setSpecialization(ALL);
  }

  return (
    <div>
      <form
        role="search"
        aria-label="Search and filter professionals"
        onSubmit={(event) => event.preventDefault()}
        className="card space-y-5"
      >
        <div className="field">
          <label className="field-label" htmlFor="professional-search">
            Search by name, category, specialization, language, or area of
            support
          </label>
          <input
            id="professional-search"
            type="search"
            className="control"
            placeholder="Try “Anxiety”, “Malayalam”, or “Psychiatrist”…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <fieldset>
            <legend className="field-label">Category</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={category === option.value}
                  onClick={() =>
                    setCategory(option.value as ProfessionalCategory | typeof ALL)
                  }
                  className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                    category === option.value
                      ? "border-sage bg-sage-soft text-foreground"
                      : "border-line text-muted hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label className="field-label" htmlFor="language-filter">
              Language
            </label>
            <select
              id="language-filter"
              className="control"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value={ALL}>All Languages</option>
              {LANGUAGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="specialization-filter">
              Area of support
            </label>
            <select
              id="specialization-filter"
              className="control"
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
            >
              <option value={ALL}>All areas</option>
              {SPECIALIZATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" role="status" aria-live="polite">
            {results.length === 0
              ? "No demonstration profiles match these filters."
              : `Showing ${results.length} of ${profiles.length} demonstration ${profiles.length === 1 ? "profile" : "profiles"}.`}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary !px-4 !py-2 text-sm"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </form>

      {results.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((profile) => (
            <li key={profile.id} className="min-w-0">
              <ProfessionalCard profile={profile} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-8 text-center" role="status">
          <h2 className="text-xl font-medium">No matches in this preview</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            No demonstration profiles match this combination of search and
            filters. Try removing a filter or searching for something like
            “Anxiety” or “English”.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-primary mt-5 !px-5 !py-2.5 text-sm"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
