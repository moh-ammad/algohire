import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  listBatchCertificates,
  type CertificateRow,
} from "@/api/certificates";
import { ApiError } from "@/api/client";
import { cancelCertificate } from "@/api/verify";
import { useAuth } from "@/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Ban, ExternalLink, RefreshCw } from "lucide-react";

export function CertificateDeliveryPanel({
  token,
  batchId,
  enabled,
}: {
  token: string;
  batchId: string;
  enabled: boolean;
}) {
  const { hasRole } = useAuth();
  const canCancel = hasRole("STATE");

  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    delivered: 0,
    issued: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<CertificateRow | null>(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await listBatchCertificates(token, batchId);
      setRows(res.certificates);
      setSummary(res.summary);
    } catch {
      toast.error("Could not load certificates");
    } finally {
      setLoading(false);
    }
  }, [token, batchId, enabled]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [load, enabled]);

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelCertificate(token, cancelTarget.certNumber, reason);
      toast.success("Certificate cancelled", {
        description: "Public verify will show cancelled immediately.",
      });
      setCancelTarget(null);
      setReason("");
      await load();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { error?: string })?.error ?? err.message)
          : "Cancel failed";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  }

  if (!enabled) return null;

  const pct =
    summary.total === 0
      ? 0
      : Math.round(((summary.delivered + summary.cancelled) / summary.total) * 100);

  return (
    <>
      <section className="space-y-5 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
        <div className="flex flex-row items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">Certificates & WhatsApp</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One cert per candidate. Run <code className="text-xs">npm run worker</code>{" "}
              for delivery.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid gap-6 border-b border-border/50 pb-4 sm:grid-cols-3">
            <Stat label="Total" value={summary.total} />
            <Stat label="Delivered" value={summary.delivered} />
            <Stat label="Cancelled" value={summary.cancelled} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pipeline</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No certificates yet — appear after State final approval.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cert #</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.certNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{c.candidate.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.candidate.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "DELIVERED"
                            ? "default"
                            : c.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/verify?c=${encodeURIComponent(c.certNumber)}`}>
                          <ExternalLink className="size-3.5" />
                          Verify
                        </Link>
                      </Button>
                      {canCancel && c.status !== "CANCELLED" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setCancelTarget(c);
                            setReason("");
                          }}
                        >
                          <Ban className="size-3.5" />
                          Cancel
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel certificate</DialogTitle>
            <DialogDescription>
              {cancelTarget?.certNumber} — employers verifying next will see{" "}
              <strong>cancelled</strong>, not genuine.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Issued in error / fraud reported"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling || reason.trim().length < 3}
              onClick={() => void confirmCancel()}
            >
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
