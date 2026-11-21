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

      <Alert>
        <FileSpreadsheet className="size-4" />
        <AlertTitle>Spreadsheet format</AlertTitle>
        <AlertDescription>
          CSV or Excel with columns <code className="text-xs">fullName</code>,{" "}
          <code className="text-xs">phone</code>,{" "}
          <code className="text-xs">courseName</code>, optional{" "}
          <code className="text-xs">nationalId</code>. Bad rows block the whole
          upload — nothing half-saved.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your batches</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${batches.length} batch(es)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">
              No batches yet. Create a draft, then upload candidates.
            </p>
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
