type Props = {
  className?: string;
};

/** Oppuna Labs mark: a square frame with a solid corner block. */
export function LabsMark({ className = "size-6" }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" fill="#141720" />
      <rect
        x="8"
        y="8"
        width="16"
        height="16"
        fill="none"
        stroke="#3155E7"
        strokeWidth="3.5"
      />
      <rect x="18" y="18" width="6" height="6" fill="#FFFFFF" />
    </svg>
  );
}

/** Text wordmark. The accessible name is the visible text. */
export function LabsWordmark({ className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LabsMark className="size-7 shrink-0" />
      <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.01em] text-foreground">
        Oppuna<span className="font-normal text-muted"> Labs</span>
      </span>
    </span>
  );
}
