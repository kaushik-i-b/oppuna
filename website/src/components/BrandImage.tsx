import { assetUrl } from "@/config/paths";

type Props = {
  /** Site-root path, e.g. `/brand/icon.png` */
  path: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/**
 * Brand asset image that always respects NEXT_PUBLIC_BASE_PATH.
 * next/image + unoptimized static export currently emits bare `/brand/...`
 * paths that break on GitHub project Pages.
 */
export function BrandImage({
  path,
  alt,
  width,
  height,
  className,
  priority = false,
}: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- basePath-safe public assets
    <img
      src={assetUrl(path)}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding="async"
      {...(priority
        ? { fetchPriority: "high" as const }
        : { loading: "lazy" as const })}
    />
  );
}
