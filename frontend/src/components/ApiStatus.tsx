import { useEffect, useState } from "react";
import { fetchReady, type ReadyResponse } from "../api/health";

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
    status === "loading"
      ? "Checking API…"
      : status === "ok"
        ? "API ready"
        : "API down";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm"
      title={
        detail
          ? `postgres=${detail.checks.postgres} redis=${detail.checks.redis}`
          : undefined
      }
    >
      <span
        className={
          status === "ok"
            ? "h-2 w-2 rounded-full bg-emerald-500"
            : status === "loading"
              ? "h-2 w-2 rounded-full bg-amber-400"
              : "h-2 w-2 rounded-full bg-red-500"
        }
        aria-hidden
      />
      <span className="text-[var(--text-h)]">{label}</span>
      {detail ? (
        <span className="text-[var(--text)]">
          pg:{detail.checks.postgres} · redis:{detail.checks.redis}
        </span>
      ) : null}
    </div>
  );
}
