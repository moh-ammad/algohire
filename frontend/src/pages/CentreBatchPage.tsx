import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { explainErrors } from "@/api/ai";
import {
  getBatch,
  submitBatch,
  uploadCandidates,
  type BatchDetail,
  type SpreadsheetError,
} from "@/api/batches";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { AuditTimeline } from "@/components/AuditTimeline";
import { CertificateDeliveryPanel } from "@/components/CertificateDeliveryPanel";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

function isEditable(status: BatchDetail["status"]) {
  return status === "DRAFT" || status === "SENT_BACK";
}

export function CentreBatchPage() {
  const { id = "" } = useParams();
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rowErrors, setRowErrors] = useState<SpreadsheetError[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [aiHelp, setAiHelp] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const res = await getBatch(token, id);
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

  async function handleFile(file: File | undefined) {
    if (!file || !token || !id) return;
    setUploading(true);
    setRowErrors([]);
    setAiHelp(null);
    try {
      const res = await uploadCandidates(token, id, file);
      setBatch(res.batch);
      toast.success("Candidates saved", {
        description: `${res.batch.candidateCount} row(s) imported atomically`,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as {
          error?: string;
          details?: { errors?: SpreadsheetError[] };
        } | null;
        const errors = body?.details?.errors ?? [];
        setRowErrors(errors);
        toast.error(body?.error ?? "Upload rejected", {
          description:
            errors.length > 0
              ? `${errors.length} issue(s) — nothing was saved`
              : undefined,
        });
        await load();
      } else {
        toast.error("Upload failed");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onSubmit() {
    if (!token || !id) return;
    setSubmitting(true);
    try {
      const res = await submitBatch(token, id);
      setBatch(res.batch);
      setRowErrors([]);
      toast.success("Submitted for district review", {
        description: res.batch.reference,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { error?: string })?.error ?? err.message)
          : "Submit failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading batch…
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Batch not found.</p>
        <Button variant="outline" asChild>
          <Link to="/centre">Back</Link>
        </Button>
      </div>
    );
  }

  const editable = isEditable(batch.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to="/centre">
              <ArrowLeft className="size-3.5" />
              All batches
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {batch.reference}
            </h1>
            <Badge>{batch.status}</Badge>
            {batch.requiresQuality ? (
              <Badge variant="secondary">Needs quality (≥50)</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {batch.candidateCount} candidate(s)
            {batch.returnReason ? ` · Returned: ${batch.returnReason}` : ""}
          </p>
        </div>

        {editable ? (
          <Button
            onClick={() => void onSubmit()}
            disabled={submitting || batch.candidateCount < 1}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Submit for approval
          </Button>
        ) : (
          <Alert className="max-w-sm">
            <AlertTitle>In review</AlertTitle>
            <AlertDescription>
              This batch is no longer editable while officers process it.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {editable ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload spreadsheet</CardTitle>
            <CardDescription>
              Drop a CSV/XLSX here. If any row is wrong, we show exact errors and
              save nothing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className={[
                "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
                dragOver
                  ? "border-primary bg-accent"
                  : "border-border bg-muted/30",
              ].join(" ")}
            >
              <Upload className="size-8 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {uploading ? "Uploading…" : "Drag & drop file"}
                </p>
                <p className="text-xs text-muted-foreground">
                  fullName, phone, courseName, nationalId?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sheet" className="sr-only">
                  Choose file
                </Label>
                <Input
                  id="sheet"
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  disabled={uploading}
                  className="max-w-xs cursor-pointer"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                />
              </div>
            </div>

            {rowErrors.length > 0 ? (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertTitle>Fix these rows — nothing was saved</AlertTitle>
                  <AlertDescription>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Issue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rowErrors.map((e, i) => (
                          <TableRow key={`${e.row}-${e.field}-${i}`}>
                            <TableCell>{e.row || "—"}</TableCell>
                            <TableCell>{e.field ?? "—"}</TableCell>
                            <TableCell>{e.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiLoading || !token}
                  onClick={() => {
                    if (!token) return;
                    setAiLoading(true);
                    void explainErrors(token, rowErrors)
                      .then((res) => {
                        setAiHelp(res.text);
                        toast.success("Gemini tips ready");
                      })
                      .catch((err) => {
                        const msg =
                          err instanceof ApiError
                            ? ((err.body as { error?: string })?.error ??
                              err.message)
                            : "AI help unavailable";
                        toast.error(msg);
                      })
                      .finally(() => setAiLoading(false));
                  }}
                >
                  {aiLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Explain with Gemini
                </Button>
                {aiHelp ? (
                  <Card className="border-primary/20 bg-accent/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Fix checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {aiHelp}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {token ? (
        <CertificateDeliveryPanel
          token={token}
          batchId={batch.id}
          enabled={batch.status === "APPROVED"}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>
            {batch.candidates.length === 0
              ? "Upload a valid sheet to populate this list."
              : "Saved candidates for this batch."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batch.candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No candidates yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.candidates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.rowNumber}</TableCell>
                    <TableCell className="font-medium">{c.fullName}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.courseName}</TableCell>
                    <TableCell>{c.nationalId ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {token ? <AuditTimeline token={token} batchId={batch.id} /> : null}
    </div>
  );
}
