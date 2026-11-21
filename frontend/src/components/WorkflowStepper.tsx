import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { key: "centre", label: "Centre" },
  { key: "district", label: "District" },
  { key: "quality", label: "Quality" },
  { key: "state", label: "State" },
  { key: "done", label: "Issued" },
] as const;

export function WorkflowStepper({
  activeIndex = 0,
  className,
}: {
  activeIndex?: number;
  className?: string;
}) {
  return (
    <ol className={cn("relative grid grid-cols-5 gap-2", className)}>
      <div
        aria-hidden
        className="absolute left-[10%] right-[10%] top-4 h-px bg-border"
      />
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <li
            key={step.key}
            className="relative z-10 flex flex-col items-center gap-2.5 text-center"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                done && "border-primary bg-primary text-primary-foreground",
                current &&
                  "border-primary bg-background text-primary ring-4 ring-primary/20 scale-110",
                !done &&
                  !current &&
                  "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "font-heading text-[11px] font-medium sm:text-xs",
                current ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
