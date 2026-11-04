"use client";

import { useId, useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { directoryCopy } from "@/content/directory";
import { professionals, type SpecializationFilterId } from "@/data/professionals";
import {
  emptyDirectoryFilters,
  filterProfessionals,
  hasActiveFilters,
  parseDirectoryFilters,
  serializeDirectoryFilters,
  type DirectoryFilterState,
} from "@/lib/filterProfessionals";
import { DirectoryDisclaimer } from "./DirectoryDisclaimer";
import { ProfessionalCard } from "./ProfessionalCard";
import { ProfessionalFilters } from "./ProfessionalFilters";
import { ProfessionalSearch } from "./ProfessionalSearch";

const FILTER_EVENT = "oppuna-directory-filters";

function subscribeToFilters(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(FILTER_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(FILTER_EVENT, onStoreChange);
  };
}

function readFilterSearch() {
  return window.location.search;
}

export function ProfessionalDirectory() {
  const pathname = usePathname();
  const searchId = useId();
  const search = useSyncExternalStore(
    subscribeToFilters,
    readFilterSearch,
    () => "",
  );
  const filters = useMemo(
    () => parseDirectoryFilters(new URLSearchParams(search)),
    [search],
  );
  const results = filterProfessionals(professionals, filters);

  function commit(update: (current: DirectoryFilterState) => DirectoryFilterState) {
    const current = parseDirectoryFilters(new URLSearchParams(window.location.search));
    const next = update(current);
    const query = serializeDirectoryFilters(next);
    const url = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(FILTER_EVENT));
  }

  function toggleSpecialization(id: SpecializationFilterId) {
    commit((current) => {
      const selected = current.specializations.includes(id);
      return {
        ...current,
        specializations: selected
          ? current.specializations.filter((item) => item !== id)
          : [...current.specializations, id],
      };
    });
  }

  const resultText =
    results.length === 1
      ? `1 ${directoryCopy.resultLabel}`
      : `${results.length} ${directoryCopy.resultsLabel}`;

  return (
    <div className="space-y-8">
      <div className="card space-y-8">
        <ProfessionalSearch
          id={searchId}
          value={filters.query}
          onChange={(query) => commit((current) => ({ ...current, query }))}
        />
        <ProfessionalFilters
          filters={filters}
          onCategory={(category) => commit((current) => ({ ...current, category }))}
          onLanguage={(language) => commit((current) => ({ ...current, language }))}
          onToggleSpecialization={toggleSpecialization}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            {resultText}
          </p>
          <button
            type="button"
            className="btn btn-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => commit(() => emptyDirectoryFilters)}
            disabled={!hasActiveFilters(filters)}
          >
            {directoryCopy.clearFilters}
          </button>
        </div>
      </div>

      <DirectoryDisclaimer />

      {results.length === 0 ? (
        <div className="card" role="status">
          <h2 className="text-2xl font-medium tracking-[-0.03em]">
            {directoryCopy.emptyTitle}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            {directoryCopy.emptyBody}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-6 min-h-11"
            onClick={() => commit(() => emptyDirectoryFilters)}
          >
            {directoryCopy.clearFilters}
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((profile) => (
            <li key={profile.id} className="min-w-0">
              <ProfessionalCard profile={profile} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
