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
    <ol
      className={cn(
        "grid grid-cols-5 gap-2 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-sm backdrop-blur",
        className,
      )}
    >
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <li
            key={step.key}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                current &&
                  "border-primary bg-accent text-accent-foreground ring-4 ring-primary/15",
                !done &&
                  !current &&
                  "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium sm:text-xs",
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
