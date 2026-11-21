import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

/** Lightweight inline SVG mark — seal + check. */
export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 36 36"
        aria-hidden
        className={cn("size-8 shrink-0 drop-shadow-sm", markClassName)}
      >
        <defs>
          <linearGradient id="cf-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.42 0.1 175)" />
            <stop offset="100%" stopColor="oklch(0.32 0.08 200)" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="10" fill="url(#cf-mark)" />
        <circle
          cx="18"
          cy="17"
          r="8.5"
          fill="none"
          stroke="oklch(0.98 0.01 165)"
          strokeWidth="1.6"
          opacity="0.9"
        />
        <path
          d="M13.2 17.2 16.4 20.2 23 13.8"
          fill="none"
          stroke="oklch(0.98 0.01 165)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark ? (
        <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
          CertiFlow
        </span>
      ) : (
        <span className="sr-only">CertiFlow</span>
      )}
    </span>
  );
}
