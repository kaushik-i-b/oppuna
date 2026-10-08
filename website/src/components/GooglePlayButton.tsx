import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { getGooglePlayHref, siteConfig } from "@/config/site";

type Props = {
  variant?: "primary" | "secondary";
  className?: string;
  children?: ReactNode;
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
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
      className={`${variants[variant]} ${className}`}
    >
      {children ?? "Download on Google Play"}
      <ExternalLink className="size-4 opacity-80" aria-hidden />
      <span className="sr-only">
        Opens Google Play for {siteConfig.packageName}
      </span>
    </a>
  );
}
