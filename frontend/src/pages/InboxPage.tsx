import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listInbox, type InboxBatch } from "@/api/inbox";
import { useAuth } from "@/auth/AuthContext";
import type { Role } from "@/auth/types";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRealtime } from "@/hooks/useRealtime";
import { Inbox, RefreshCw } from "lucide-react";

const TITLES: Record<string, { title: string; blurb: string }> = {
  DISTRICT: {
    title: "District inbox",
    blurb: "Two different officers must approve before the batch moves on.",
  },
  QUALITY: {
    title: "Quality inbox",
    blurb: "Large batches (≥50) land here before state.",
  },
  STATE: {
    title: "State inbox",
    blurb: "Final seal. Certificates issue after your approve.",
  },
};

export function InboxPage({ role }: { role: Role }) {
  const { token, user } = useAuth();
  const [batches, setBatches] = useState<InboxBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const copy = TITLES[role] ?? { title: "Inbox", blurb: "" };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listInbox(token);
      setBatches(res.batches);
    } catch {
      toast.error("Could not load inbox");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime(
    ["batch.status_changed", "batch.stuck"],
    () => {
      void load();
    },
    { enabled: !!token },
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={copy.title}
        description={
          <>
            {user?.name} · {copy.blurb}
          </>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        }
      />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Waiting for you</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${batches.length} batch(es)`}
          </p>
        </div>

        {batches.length === 0 && !loading ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12">
            <Inbox className="size-8 text-muted-foreground/60" />
            <p className="max-w-md text-sm text-muted-foreground">
              Nothing in your queue. When Anika submits a batch, it appears here
              for your desk.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Reference</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Candidates</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id} className="transition-colors">
                    <TableCell className="font-medium">{b.reference}</TableCell>
                    <TableCell>{b.centre?.name ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{b.candidateCount}</TableCell>
                    <TableCell>
                      <Badge variant={b.quorum.youVoted ? "secondary" : "outline"}>
                        {b.quorum.approveCount}/{b.quorum.required}
                        {b.quorum.youVoted ? " · you voted" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" asChild>
                        <Link to={`/inbox/${b.id}`}>Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
