import { useEffect, useState } from "react";
import { fetchReady, type ReadyResponse } from "@/api/health";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Status = "loading" | "ok" | "down";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<ReadyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const ready = await fetchReady();
        if (cancelled) return;
        setDetail(ready);
        setStatus(ready.ok ? "ok" : "down");
      } catch {
        if (cancelled) return;
        setDetail(null);
        setStatus("down");
      }
    }

    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const label =
    status === "loading" ? "Checking…" : status === "ok" ? "API ready" : "API down";

  const variant =
    status === "ok" ? "secondary" : status === "loading" ? "outline" : "destructive";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} className="cursor-default gap-1.5 px-2.5 py-1">
          <span
            className={
              status === "ok"
                ? "size-1.5 rounded-full bg-emerald-500"
                : status === "loading"
                  ? "size-1.5 rounded-full bg-amber-400"
                  : "size-1.5 rounded-full bg-red-500"
            }
            aria-hidden
          />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {detail
          ? `postgres: ${detail.checks.postgres} · redis: ${detail.checks.redis}`
          : "Cannot reach backend /ready"}
      </TooltipContent>
    </Tooltip>
  );
}
