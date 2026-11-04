import { directoryCopy } from "@/content/directory";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

export function ProfessionalSearch({ id, value, onChange }: Props) {
  const hintId = `${id}-hint`;

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {directoryCopy.searchLabel}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={directoryCopy.searchPlaceholder}
        autoComplete="off"
        enterKeyHint="search"
        aria-describedby={hintId}
        className="control"
      />
      <p id={hintId} className="text-sm leading-relaxed text-muted">
        {directoryCopy.searchHint}
      </p>
    </div>
  );
}
