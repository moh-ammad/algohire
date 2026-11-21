import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listBatchCertificates,
  type CertificateRow,
} from "@/api/certificates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

export function CertificateDeliveryPanel({
  token,
  batchId,
  enabled,
}: {
  token: string;
  batchId: string;
  enabled: boolean;
}) {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    delivered: 0,
    issued: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(false);

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

  if (!enabled) return null;

  const pct =
    summary.total === 0 ? 0 : Math.round((summary.delivered / summary.total) * 100);

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Certificates & WhatsApp</CardTitle>
          <CardDescription>
            One cert per candidate. Delivery runs on the worker (`npm run worker`).
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Delivered {summary.delivered}/{summary.total}
            </span>
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
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.certNumber}</TableCell>
                  <TableCell className="font-medium">{c.candidate.fullName}</TableCell>
                  <TableCell>{c.candidate.phone}</TableCell>
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
                  <TableCell>
                    {c.waAttempts}
                    {c.waLastError ? (
                      <span className="block max-w-[10rem] truncate text-[10px] text-destructive">
                        {c.waLastError}
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
