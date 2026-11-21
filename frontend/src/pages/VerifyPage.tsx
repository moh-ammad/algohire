import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { verifyCertificate, type VerifyResult } from "@/api/verify";
import { CertificateArt } from "@/components/CertificateArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Ban,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifyPage() {
  const [params] = useSearchParams();
  const [certNumber, setCertNumber] = useState(params.get("c") ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    const preset = params.get("c");
    if (!preset) return;
    setCertNumber(preset);
    setLoading(true);
    void verifyCertificate(preset)
      .then(setResult)
      .catch(() => toast.error("Could not verify preset certificate"))
      .finally(() => setLoading(false));
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!certNumber.trim()) {
      toast.error("Enter a certificate number");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyCertificate(certNumber);
      setResult(res);
      if (res.status === "valid") toast.success("Certificate is genuine");
      else if (res.status === "cancelled") toast.message("Certificate cancelled");
      else toast.message("Not found");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { error?: string })?.error ?? err.message)
          : "Verification failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 overflow-hidden px-4 py-10 sm:rounded-3xl sm:px-10 sm:py-14 lg:mx-0">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,oklch(0.75_0.08_175/0.35),transparent_50%),linear-gradient(165deg,oklch(0.96_0.02_165),oklch(0.92_0.03_180))]"
        />
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <p className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              CertiFlow
            </p>
            <h1 className="max-w-xl font-serif text-2xl leading-snug text-foreground/90 sm:text-3xl">
              Check a certificate. Know if it is real.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Public verification — no account. Paste the number printed on the
              certificate.
            </p>

            <form onSubmit={onSubmit} className="max-w-xl space-y-3">
              <Label htmlFor="cert" className="text-xs uppercase tracking-wider">
                Certificate number
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="cert"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value.toUpperCase())}
                  placeholder="CF-XXXX-0001"
                  className="h-12 border-border/80 bg-background/90 font-mono text-base tracking-wide shadow-sm"
                  autoComplete="off"
                />
                <Button type="submit" size="lg" disabled={loading} className="h-12 sm:min-w-32">
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  Check
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: <code>CF-1121VYBQ-0002</code>
              </p>
            </form>

            <Button variant="ghost" className="px-0 text-muted-foreground" asChild>
              <Link to="/">← Back home</Link>
            </Button>
          </div>

          <div className="hidden justify-center lg:flex">
            <CertificateArt className="-rotate-2 scale-95" />
          </div>
        </div>
      </section>

      {result ? (
        <div className="animate-in fade-in-0 zoom-in-95 duration-300">
          <VerifyResultPanel result={result} />
        </div>
      ) : null}
    </div>
  );
}

function VerifyResultPanel({ result }: { result: VerifyResult }) {
  const tone =
    result.status === "valid"
      ? {
          icon: ShieldCheck,
          badge: "Genuine",
          ring: "border-emerald-500/40",
          wash: "from-emerald-500/15 via-background to-background",
          iconClass: "text-emerald-600",
        }
      : result.status === "cancelled"
        ? {
            icon: Ban,
            badge: "Cancelled",
            ring: "border-destructive/40",
            wash: "from-destructive/12 via-background to-background",
            iconClass: "text-destructive",
          }
        : {
            icon: ShieldQuestion,
            badge: "Not found",
            ring: "border-border",
            wash: "from-muted/80 via-background to-background",
            iconClass: "text-muted-foreground",
          };

  const Icon = tone.icon;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-sm sm:p-8",
        tone.ring,
        tone.wash,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-2xl bg-background shadow-sm",
            tone.iconClass,
          )}
        >
          <Icon className="size-9" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-3xl font-semibold">{tone.badge}</h2>
              <Badge variant="outline" className="font-mono">
                {result.certNumber}
              </Badge>
            </div>
            <p className="text-sm text-foreground/80 sm:text-base">{result.message}</p>
          </div>

          {result.status === "valid" ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Candidate" value={result.candidateName ?? "—"} />
              <Fact label="Course" value={result.courseName ?? "—"} />
              <Fact label="Training centre" value={result.centreName ?? "—"} />
              <Fact
                label="Issued"
                value={
                  result.issuedAt
                    ? new Date(result.issuedAt).toLocaleString()
                    : "—"
                }
              />
            </dl>
          ) : null}

          {result.status === "cancelled" ? (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-background/70 p-4 text-sm text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              A cancelled certificate must never be treated as genuine by employers.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
