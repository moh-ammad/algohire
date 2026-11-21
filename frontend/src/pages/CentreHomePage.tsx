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
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Centre workspace</h1>
          <p className="text-sm text-muted-foreground">
            {user?.name} · upload passed candidates, fix row errors, submit for
            district review.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => void onCreate()} disabled={creating}>
            <Plus className="size-3.5" />
            New batch
          </Button>
        </div>
      </div>

      <WorkflowStepper activeIndex={0} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Editable</CardDescription>
            <CardTitle className="text-3xl">{loading ? "—" : drafts}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>In review</CardDescription>
            <CardTitle className="text-3xl">{loading ? "—" : inReview}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl">{loading ? "—" : approved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Alert className="border-primary/20 bg-accent/30">
        <FileSpreadsheet className="size-4" />
        <AlertTitle>Spreadsheet format</AlertTitle>
        <AlertDescription>
          CSV or Excel: <code className="text-xs">fullName</code>,{" "}
          <code className="text-xs">phone</code>,{" "}
          <code className="text-xs">courseName</code>, optional{" "}
          <code className="text-xs">nationalId</code>. Bad rows block the whole
          upload — use <strong>Explain with Gemini</strong> on the batch page for
          fix tips.
        </AlertDescription>
      </Alert>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Your batches</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${batches.length} batch(es)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10">
              <p className="text-sm text-muted-foreground">
                No batches yet. Create a draft, upload candidates, then submit.
              </p>
              <Button onClick={() => void onCreate()} disabled={creating}>
                <Plus className="size-3.5" />
                Create first batch
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell className="text-right">{b.candidateCount}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link to={`/centre/batches/${b.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
