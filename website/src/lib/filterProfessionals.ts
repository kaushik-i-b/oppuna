import {
  categoryLabels,
  directoryLanguages,
  professionalCategories,
  professionals,
  specializationFilters,
  type DirectoryLanguage,
  type Professional,
  type ProfessionalCategory,
  type SpecializationFilterId,
} from "@/data/professionals";

export type DirectoryFilterState = {
  query: string;
  category: "all" | ProfessionalCategory;
  language: "all" | DirectoryLanguage;
  specializations: readonly SpecializationFilterId[];
};

export const emptyDirectoryFilters: DirectoryFilterState = {
  query: "",
  category: "all",
  language: "all",
  specializations: [],
};

const specializationIds = new Set<string>(
  specializationFilters.map((filter) => filter.id),
);

export function profileMatchesSpecialization(
  profile: Professional,
  filterId: SpecializationFilterId,
): boolean {
  const filter = specializationFilters.find((item) => item.id === filterId);
  if (!filter) return false;
  const areas = new Set(profile.focusAreas.map((area) => area.id));
  return filter.matches.some((areaId) => areas.has(areaId));
}

export function searchableText(profile: Professional): string {
  const matchedFilters = specializationFilters
    .filter((filter) => profileMatchesSpecialization(profile, filter.id))
    .map((filter) => filter.label);

  return [
    profile.name,
    categoryLabels[profile.category],
    ...profile.languages,
    ...profile.focusAreas.map((area) => area.label),
    ...matchedFilters,
    profile.description,
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Category, language, and selected specializations combine with AND.
 * Every selected specialization must match. Search tokens also combine with AND.
 */
export function filterProfessionals(
  records: readonly Professional[],
  filters: DirectoryFilterState,
): Professional[] {
  const tokens = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return records.filter((profile) => {
    if (filters.category !== "all" && profile.category !== filters.category) {
      return false;
    }

    if (
      filters.language !== "all" &&
      !profile.languages.some(
        (language) => language.toLowerCase() === filters.language.toLowerCase(),
      )
    ) {
      return false;
    }

    if (
      filters.specializations.length > 0 &&
      !filters.specializations.every((filterId) =>
        profileMatchesSpecialization(profile, filterId),
      )
    ) {
      return false;
    }

    if (tokens.length > 0) {
      const haystack = searchableText(profile);
      if (!tokens.every((token) => haystack.includes(token))) return false;
    }

    return true;
  });
}

export function hasActiveFilters(filters: DirectoryFilterState): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.category !== "all" ||
    filters.language !== "all" ||
    filters.specializations.length > 0
  );
}

function canonicalCategory(value: string | null): ProfessionalCategory | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return (
    professionalCategories.find((category) => category === normalized) ?? null
  );
}

function canonicalLanguage(value: string | null): DirectoryLanguage | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return (
    directoryLanguages.find(
      (language) => language.toLowerCase() === normalized,
    ) ?? null
  );
}

function isSpecialization(value: string): value is SpecializationFilterId {
  return specializationIds.has(value);
}

export function parseDirectoryFilters(
  params: Pick<URLSearchParams, "get">,
): DirectoryFilterState {
  const categoryValue = params.get("category");
  const languageValue = params.get("language");
  const focusValue = params.get("focus") ?? "";
  const specializations = focusValue
    .split(",")
    .map((value) => value.trim())
    .filter(isSpecialization);

  return {
    query: params.get("q") ?? "",
    category: canonicalCategory(categoryValue) ?? "all",
    language: canonicalLanguage(languageValue) ?? "all",
    specializations,
  };
}

export function serializeDirectoryFilters(
  filters: DirectoryFilterState,
): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query);
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.language !== "all") params.set("language", filters.language);
  if (filters.specializations.length > 0) {
    params.set("focus", filters.specializations.join(","));
  }
  return params.toString();
}

export function directoryResultCount(): number {
  return professionals.length;
}

function assertDirectoryFilters(): void {
  const all = filterProfessionals(professionals, emptyDirectoryFilters);
  const kannada = filterProfessionals(professionals, {
    ...emptyDirectoryFilters,
    language: "Kannada",
  });
  const tamil = filterProfessionals(professionals, {
    ...emptyDirectoryFilters,
    language: "Tamil",
  });
  const anxietyAndTrauma = filterProfessionals(professionals, {
    ...emptyDirectoryFilters,
    specializations: ["anxiety", "trauma"],
  });
  const psychiatristSearch = filterProfessionals(professionals, {
    ...emptyDirectoryFilters,
    query: "PSYCHIATRIST",
  });
  const kannadaCounsellor = filterProfessionals(professionals, {
    ...emptyDirectoryFilters,
    category: "counselling-psychologist",
    language: "Kannada",
  });
  const parsed = parseDirectoryFilters(
    new URLSearchParams("category=psychiatrist&language=malayalam&focus=anxiety,sleep"),
  );

  if (all.length !== 4) throw new Error("Expected 4 demonstration profiles.");
  if (kannada.length !== 2) throw new Error("Kannada filter mismatch.");
  if (tamil.length !== 0) throw new Error("Tamil should have no preview profiles.");
  if (anxietyAndTrauma.length !== 1 || anxietyAndTrauma[0]?.slug !== "dr-kavya-nair") {
    throw new Error("Combined specialization filter mismatch.");
  }
  if (psychiatristSearch.length !== 1) throw new Error("Search should be case-insensitive.");
  if (kannadaCounsellor.length !== 1 || kannadaCounsellor[0]?.slug !== "arjun-desai") {
    throw new Error("Combined category and language filter mismatch.");
  }
  if (parsed.category !== "psychiatrist" || parsed.language !== "Malayalam") {
    throw new Error("Filter query parsing mismatch.");
  }
  if (parsed.specializations.join(",") !== "anxiety,sleep") {
    throw new Error("Specialization query parsing mismatch.");
  }
  const spaced = parseDirectoryFilters(
    new URLSearchParams(
      serializeDirectoryFilters({
        ...emptyDirectoryFilters,
        query: "Ananya Rao",
      }),
    ),
  );
  if (spaced.query !== "Ananya Rao") {
    throw new Error("Search must preserve spaces between words.");
  }
}

assertDirectoryFilters();
