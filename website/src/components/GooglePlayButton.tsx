import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { getGooglePlayHref, siteConfig } from "@/config/site";

type Props = {
  variant?: "primary" | "secondary" | "light";
  className?: string;
  children?: ReactNode;
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-sage text-white hover:bg-sage-deep shadow-sm shadow-sage/20",
  secondary:
    "bg-transparent text-sage-deep border border-sage/30 hover:border-sage hover:bg-sage-soft/50",
  light: "bg-white text-sage-deep hover:bg-sage-soft shadow-sm",
};

export function GooglePlayButton({
  variant = "primary",
  className = "",
  children,
}: Props) {
  return (
    <a
      href={getGooglePlayHref()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.95rem] font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {children ?? "Download on Google Play"}
      <ExternalLink className="size-4 opacity-80" aria-hidden />
      <span className="sr-only">
        Opens Google Play for {siteConfig.packageName}
      </span>
    </a>
  );
}
