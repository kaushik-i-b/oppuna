import { BrandImage } from "./BrandImage";

type Props = {
  className?: string;
};

/** The Oppuna leaf logo (public/brand/icon.png), shared by Oppuna Labs. */
export function LabsMark({ className = "size-7" }: Props) {
  return (
    <BrandImage
      path="/brand/icon.png"
      alt=""
      width={56}
      height={56}
      className={className}
      priority
    />
  );
}

/** Logo plus text wordmark. The accessible name is the visible text. */
export function LabsWordmark({ className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LabsMark className="size-8 shrink-0" />
      <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.01em] text-foreground">
        Oppuna<span className="font-normal text-muted"> Labs</span>
      </span>
    </span>
  );
}
