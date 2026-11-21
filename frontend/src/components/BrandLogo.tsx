import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

/** Lightweight inline SVG mark — no heavy image asset. */
export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        aria-hidden
        className={cn("size-8 shrink-0", markClassName)}
      >
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M8 16.5c0-4 2.8-7 7-7s7 3 7 7c0 2.2-1 4.1-2.6 5.4L16 24l-3.4-2.1C10.9 20.6 8 18.7 8 16.5Z"
          className="fill-primary-foreground/95"
        />
        <path
          d="M12.2 16.2 14.6 18.5 19.8 13.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
      </svg>
      {showWordmark ? (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          CertiFlow
        </span>
      ) : (
        <span className="sr-only">CertiFlow</span>
      )}
    </span>
  );
}
