import { directoryCopy } from "@/content/directory";
import {
  categoryFilterLabels,
  directoryLanguages,
  professionalCategories,
  specializationFilters,
  type SpecializationFilterId,
} from "@/data/professionals";
import type { DirectoryFilterState } from "@/lib/filterProfessionals";

type Props = {
  filters: DirectoryFilterState;
  onCategory: (category: DirectoryFilterState["category"]) => void;
  onLanguage: (language: DirectoryFilterState["language"]) => void;
  onToggleSpecialization: (id: SpecializationFilterId) => void;
};

export function ProfessionalFilters({
  filters,
  onCategory,
  onLanguage,
  onToggleSpecialization,
}: Props) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium">{directoryCopy.categoryLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterButton
            pressed={filters.category === "all"}
            onClick={() => onCategory("all")}
          >
            {directoryCopy.allProfessionals}
          </FilterButton>
          {professionalCategories.map((category) => (
            <FilterButton
              key={category}
              pressed={filters.category === category}
              onClick={() => onCategory(category)}
            >
              {categoryFilterLabels[category]}
            </FilterButton>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">{directoryCopy.languageLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterButton
            pressed={filters.language === "all"}
            onClick={() => onLanguage("all")}
          >
            {directoryCopy.allLanguages}
          </FilterButton>
          {directoryLanguages.map((language) => (
            <FilterButton
              key={language}
              pressed={filters.language === language}
              onClick={() => onLanguage(language)}
            >
              {language}
            </FilterButton>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">
          {directoryCopy.specializationLegend}
        </legend>
        <p id="specialization-hint" className="mt-2 text-sm leading-relaxed text-muted">
          {directoryCopy.specializationHint}
        </p>
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-describedby="specialization-hint"
        >
          {specializationFilters.map((filter) => {
            const selected = filters.specializations.includes(filter.id);
            return (
              <FilterButton
                key={filter.id}
                pressed={selected}
                onClick={() => onToggleSpecialization(filter.id)}
              >
                {filter.label}
              </FilterButton>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function FilterButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3.5 py-2 text-left text-sm leading-tight transition-colors ${
        pressed
          ? "border-sage bg-sage-soft text-foreground"
          : "border-line bg-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
