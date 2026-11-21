import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, Sparkles, Upload, Users } from "lucide-react";

export function HomePage() {
  const { user, hasRole } = useAuth();

  const workspace =
    user?.role === "CENTRE"
      ? "/centre"
      : user?.role === "DISTRICT"
        ? "/officer"
        : user?.role === "QUALITY"
          ? "/quality"
          : user?.role === "STATE"
            ? "/state"
            : null;

  return (
    <div className="space-y-12">
      {/* Hero — one composition */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-accent/40 px-6 py-12 shadow-sm sm:px-10 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-10 size-80 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative max-w-2xl space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <Badge variant="secondary" className="w-fit gap-1.5">
            <Sparkles className="size-3.5" />
            Pragati Skills Mission
          </Badge>

          <div className="flex items-center gap-4">
            <BrandLogo showWordmark={false} markClassName="size-14 shadow-md" />
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              CertiFlow
            </h1>
          </div>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            From training centre spreadsheet to a certificate anyone can trust —
            with a clear approval chain and a public verify check.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/verify">Verify a certificate</Link>
            </Button>
            {workspace ? (
              <Button size="lg" variant="outline" asChild>
                <Link to={workspace}>Open my workspace</Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <a href="#how">See how it works</a>
              </Button>
            )}
          </div>

          {user ? (
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{user.name}</span> ·{" "}
              {user.role}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Use <strong>Demo users</strong> in the header — Anika → Dev → Meera →
              Farah.
            </p>
          )}
        </div>
      </section>

      <section id="how" className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Approval path</h2>
          <p className="text-sm text-muted-foreground">
            Reviewers switch personas and walk one batch end-to-end.
          </p>
        </div>
        <WorkflowStepper
          activeIndex={
            hasRole("STATE")
              ? 3
              : hasRole("QUALITY")
                ? 2
                : hasRole("DISTRICT")
                  ? 1
                  : hasRole("CENTRE")
                    ? 0
                    : 0
          }
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card/90 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
          <CardHeader>
            <Upload className="mb-2 size-5 text-primary" />
            <CardTitle>Centres submit</CardTitle>
            <CardDescription>
              Upload CSV/XLSX. Bad rows fail with exact fixes — nothing half-saved.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/80 bg-card/90 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
          <CardHeader>
            <Users className="mb-2 size-5 text-primary" />
            <CardTitle>Officers decide</CardTitle>
            <CardDescription>
              Two district votes, quality for large batches, state has the final say.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/80 bg-card/90 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
          <CardHeader>
            <ShieldCheck className="mb-2 size-5 text-primary" />
            <CardTitle>Public verify</CardTitle>
            <CardDescription>
              Employers check a certificate in seconds — no login.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
