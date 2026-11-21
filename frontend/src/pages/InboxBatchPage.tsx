import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import {
  decideInbox,
  getInboxBatch,
  type Decision,
  type InboxBatch,
} from "@/api/inbox";
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Loader2, RotateCcw, X } from "lucide-react";

function homeForRole(role: string | undefined) {
  if (role === "DISTRICT") return "/officer";
  if (role === "QUALITY") return "/quality";
  if (role === "STATE") return "/state";
  return "/";
}

export function InboxBatchPage() {
  const { id = "" } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<InboxBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const res = await getInboxBatch(token, id);
      setBatch(res.batch);
    } catch {
      toast.error("Batch not found");
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(decision: Decision) {
    if (!token || !id) return;
    setBusy(true);
    try {
      const res = await decideInbox(
        token,
        id,
        decision,
        decision === "APPROVE" ? undefined : reason,
      );
      setBatch(res.batch);
      toast.success(
        decision === "APPROVE"
          ? `Approved — now ${res.batch.status}`
          : decision === "REJECT"
            ? "Batch rejected"
            : "Sent back to centre",
      );
      if (res.batch.status !== batch?.status) {
        // Left this officer's queue
        window.setTimeout(() => navigate(homeForRole(user?.role)), 600);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { error?: string })?.error ?? err.message)
          : "Decision failed";
      toast.error(msg);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!batch) {
    return (
      <Button variant="outline" asChild>
        <Link to={homeForRole(user?.role)}>Back to inbox</Link>
      </Button>
    );
  }

  const canAct =
    !batch.quorum.youVoted &&
    ((user?.role === "DISTRICT" && batch.status === "DISTRICT_REVIEW") ||
      (user?.role === "QUALITY" && batch.status === "QUALITY_REVIEW") ||
      (user?.role === "STATE" && batch.status === "STATE_REVIEW"));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link to={homeForRole(user?.role)}>
            <ArrowLeft className="size-3.5" />
            Inbox
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {batch.reference}
          </h1>
          <Badge>{batch.status}</Badge>
          <Badge variant="outline">
            Votes {batch.quorum.approveCount}/{batch.quorum.required}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {batch.centre?.name} · {batch.candidateCount} candidates
        </p>
      </div>

      {user?.role === "DISTRICT" ? (
        <Alert>
          <AlertTitle>District quorum</AlertTitle>
          <AlertDescription>
            Need <strong>2 different</strong> officers. After Dev approves, Meera
            (or Kabir) must also approve — then it moves to State (or Quality if
            ≥50).
          </AlertDescription>
        </Alert>
      ) : null}

      {canAct ? (
        <Card>
          <CardHeader>
            <CardTitle>Your decision</CardTitle>
            <CardDescription>
              Reject / send-back require a short reason.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (for reject / send-back)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Phone numbers look wrong — please fix rows 3–4"
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void decide("APPROVE")}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Approve
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void decide("SEND_BACK")}
              >
                <RotateCcw className="size-4" />
                Send back
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => void decide("REJECT")}
              >
                <X className="size-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTitle>
            {batch.quorum.youVoted ? "You already decided" : "Not actionable"}
          </AlertTitle>
          <AlertDescription>
            Current status: {batch.status}. Switch to another demo user if this
            batch is waiting on a different role.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Course</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.candidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.fullName}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.courseName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {batch.approvals && batch.approvals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Decisions so far</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Who</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.approvals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.user.name}</TableCell>
                    <TableCell>{a.stage}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.decision}</Badge>
                    </TableCell>
                    <TableCell>{a.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
