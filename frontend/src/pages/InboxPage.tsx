import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listInbox, type InboxBatch } from "@/api/inbox";
import { useAuth } from "@/auth/AuthContext";
import type { Role } from "@/auth/types";
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
import { RefreshCw } from "lucide-react";

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
    blurb: "Final approval. Certificates issue after this (next task).",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {user?.name} · {copy.blurb}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waiting for you</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${batches.length} batch(es) at your step`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">
              Nothing in your queue. When Anika submits a batch, district officers
              see it here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Candidates</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.reference}</TableCell>
                    <TableCell>{b.centre?.name ?? "—"}</TableCell>
                    <TableCell>{b.candidateCount}</TableCell>
                    <TableCell>
                      <Badge variant={b.quorum.youVoted ? "secondary" : "outline"}>
                        {b.quorum.approveCount}/{b.quorum.required}
                        {b.quorum.youVoted ? " · you voted" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link to={`/inbox/${b.id}`}>Review</Link>
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
