import { cn } from "@/lib/utils";

/** Decorative certificate plane for hero / verify — CSS only. */
export function CertificateArt({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "cf-paper relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-sm p-6 sm:p-8",
        "animate-in fade-in-0 slide-in-from-right-4 duration-700",
        className,
      )}
    >
      <div className="absolute inset-x-4 top-4 h-px bg-primary/20" />
      <div className="absolute inset-x-4 bottom-4 h-px bg-primary/20" />
      <div className="absolute inset-y-4 left-4 w-px bg-primary/20" />
      <div className="absolute inset-y-4 right-4 w-px bg-primary/20" />

      <div className="flex h-full flex-col items-center justify-between py-4 text-center">
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-primary/70">
            Pragati Skills Mission
          </p>
          <div className="mx-auto size-12 rounded-full border-2 border-primary/30 bg-primary/10" />
        </div>

        <div className="space-y-3 px-2">
          <p className="font-serif text-2xl leading-tight text-foreground/90">
            Certificate of Completion
          </p>
          <div className="mx-auto h-px w-16 bg-primary/30" />
          <p className="font-serif text-lg italic text-foreground/70">Candidate Name</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            has successfully completed the approved training programme under
            district and state verification.
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="flex justify-between gap-4 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Centre seal</span>
            <span>State officer</span>
          </div>
          <div className="rounded-md bg-primary/8 px-3 py-2 font-mono text-[11px] tracking-wide text-primary">
            CF-····-····
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-8 top-1/3 size-28 rotate-12 rounded-full border border-primary/15" />
      <div className="pointer-events-none absolute -left-10 bottom-10 size-24 -rotate-6 rounded-full border border-primary/10" />
    </div>
  );
}
