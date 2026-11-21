import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listStuck, scanStuck, type StuckBatch } from "@/api/admin";
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
import { AlertTriangle, RefreshCw, ScanSearch } from "lucide-react";

function formatIdle(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function StuckQueue({ token }: { token: string }) {
  const [batches, setBatches] = useState<StuckBatch[]>([]);
  const [threshold, setThreshold] = useState(1440);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listStuck(token);
      setBatches(res.batches);
      setThreshold(res.thresholdMinutes);
    } catch {
      toast.error("Could not load stuck queue");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onScan() {
    setScanning(true);
    try {
      const res = await scanStuck(token);
      setBatches(res.batches);
      setThreshold(res.thresholdMinutes);
      toast.success(
        res.newlyFlagged
          ? `Flagged ${res.newlyFlagged} stuck batch(es)`
          : `Scan done — ${res.stuckCount} stuck`,
      );
    } catch {
      toast.error("Stuck scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            <h2 className="font-heading text-xl font-semibold">Stuck batches</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Idle in review longer than {threshold} minutes. Worker also scans
            every minute.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => void onScan()} disabled={scanning}>
            <ScanSearch className="size-3.5" />
            Run scan
          </Button>
        </div>
      </div>

      {batches.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-sm text-muted-foreground">
          No stuck batches. For demos, age a batch with SQL then hit Run scan.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-amber-500/25 bg-card/70">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Reference</TableHead>
                <TableHead>Centre</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Idle</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.reference}</TableCell>
                  <TableCell>{b.centre.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{b.status}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-amber-800">
                    {formatIdle(b.idleMinutes)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="secondary" asChild>
                      <Link to={`/inbox/${b.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
