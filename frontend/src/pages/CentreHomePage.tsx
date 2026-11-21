import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  createBatch,
  listBatches,
  type BatchSummary,
} from "@/api/batches";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Plus, RefreshCw } from "lucide-react";

function statusVariant(status: BatchSummary["status"]) {
  switch (status) {
    case "DRAFT":
      return "secondary" as const;
    case "SENT_BACK":
      return "destructive" as const;
    case "APPROVED":
      return "default" as const;
    default:
      return "outline" as const;
  }
}

export function CentreHomePage() {
  const { user, token } = useAuth();
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listBatches(token);
      setBatches(res.batches);
    } catch {
      toast.error("Could not load batches");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate() {
    if (!token) return;
    setCreating(true);
    try {
      const res = await createBatch(token);
      toast.success("Draft batch created", {
        description: res.batch.reference,
      });
      await load();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { error?: string })?.error ?? err.message)
          : "Create failed";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  const drafts = batches.filter((b) => b.status === "DRAFT" || b.status === "SENT_BACK").length;
  const inReview = batches.filter((b) =>
    ["DISTRICT_REVIEW", "QUALITY_REVIEW", "STATE_REVIEW"].includes(b.status),
  ).length;
  const approved = batches.filter((b) => b.status === "APPROVED").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Centre workspace"
        description={
          <>
            {user?.name} · upload passed candidates, fix row errors, submit for
            district review.
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => void onCreate()} disabled={creating}>
              <Plus className="size-3.5" />
              New batch
            </Button>
          </>
        }
      />

      <WorkflowStepper activeIndex={0} />

      <div className="grid gap-6 border-b border-border/60 pb-6 sm:grid-cols-3">
        <Metric label="Editable" value={loading ? "—" : String(drafts)} />
        <Metric label="In review" value={loading ? "—" : String(inReview)} />
        <Metric label="Approved" value={loading ? "—" : String(approved)} />
      </div>

      <div className="flex gap-3 rounded-2xl border border-primary/15 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
        <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          CSV or Excel: <code className="text-xs">fullName</code>,{" "}
          <code className="text-xs">phone</code>,{" "}
          <code className="text-xs">courseName</code>, optional{" "}
          <code className="text-xs">nationalId</code>. Bad rows block the whole
          upload.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Your batches</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${batches.length} batch(es)`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-2/3 rounded-xl" />
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12">
            <p className="max-w-md text-sm text-muted-foreground">
              No batches yet. Create a draft, upload candidates, then submit.
            </p>
            <Button onClick={() => void onCreate()} disabled={creating}>
              <Plus className="size-3.5" />
              Create first batch
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Candidates</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.reference}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {b.candidateCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" asChild>
                        <Link to={`/centre/batches/${b.id}`}>Open</Link>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
