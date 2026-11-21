import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getBatchTimeline, type TimelineEvent } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

const ACTION_LABEL: Record<string, string> = {
  BATCH_CREATED: "Batch created",
  BATCH_SUBMITTED: "Submitted for review",
  BATCH_APPROVE: "Approved",
  BATCH_REJECT: "Rejected",
  BATCH_SEND_BACK: "Sent back",
  BATCH_STUCK_FLAGGED: "Flagged as stuck",
  CERTIFICATES_ISSUED: "Certificates issued",
  CERTIFICATE_CANCELLED: "Certificate cancelled",
};

export function AuditTimeline({
  token,
  batchId,
}: {
  token: string;
  batchId: string;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBatchTimeline(token, batchId);
      setEvents(res.events);
    } catch {
      toast.error("Could not load audit timeline");
    } finally {
      setLoading(false);
    }
  }, [token, batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Audit timeline</h2>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {events.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">No audit events yet.</p>
      ) : (
        <ol className="relative space-y-0 border-l border-border/80 pl-6">
          {events.map((e) => (
            <li key={e.id} className="relative pb-6 last:pb-0">
              <span className="absolute -left-[1.55rem] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-background" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  {ACTION_LABEL[e.action] ?? e.action}
                </p>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {e.action}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {e.actor
                  ? `${e.actor.name} · ${e.actor.role}`
                  : "System"}{" "}
                · {new Date(e.createdAt).toLocaleString()}
              </p>
              {e.meta && typeof e.meta === "object" ? (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
                  {JSON.stringify(e.meta, null, 0)}
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
