import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { CertificateArt } from "@/components/CertificateArt";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-16">
      {/* Full-bleed hero composition */}
      <section className="relative -mx-4 overflow-hidden px-4 sm:-mx-4 sm:px-4 lg:mx-0 lg:rounded-3xl lg:px-0">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.72_0.1_175/0.35),transparent_55%),radial-gradient(ellipse_at_90%_80%,oklch(0.7_0.06_200/0.25),transparent_50%),linear-gradient(160deg,oklch(0.28_0.06_175)_0%,oklch(0.35_0.08_185)_45%,oklch(0.42_0.07_165)_100%)]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 cf-mesh opacity-20 mix-blend-overlay" />

        <div className="grid items-center gap-10 px-2 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-12 lg:py-20">
          <div className="space-y-7 text-primary-foreground animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
            <p className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              CertiFlow
            </p>
            <h1 className="max-w-xl font-serif text-2xl leading-snug text-primary-foreground/95 sm:text-3xl">
              Skills certificates that employers can trust in seconds.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-primary-foreground/75 sm:text-lg">
              Centres upload. Officers approve. State seals. Anyone verifies —
              without another login wall.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
                asChild
              >
                <Link to="/verify">Verify a certificate</Link>
              </Button>
              {workspace ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to={workspace}>Open my workspace</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href="#path">See the approval path</a>
                </Button>
              )}
            </div>
            <p className="text-sm text-primary-foreground/60">
              {user ? (
                <>
                  Signed in as <span className="text-primary-foreground">{user.name}</span> ·{" "}
                  {user.role}
                </>
              ) : (
                <>Use Demo users in the header — Anika → Dev → Meera → Farah.</>
              )}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-full bg-emerald-300/20 blur-3xl animate-in fade-in-0 duration-1000"
            />
            <CertificateArt className="mx-auto rotate-1 transition-transform duration-500 hover:-rotate-1" />
          </div>
        </div>
      </section>

      <section id="path" className="space-y-5">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Approval path
          </h2>
          <p className="font-serif text-muted-foreground">
            One batch, four desks, a sealed certificate.
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

      <section className="grid gap-8 border-t border-border/60 pt-10 sm:grid-cols-3">
        <Feature
          step="01"
          title="Centres submit"
          body="Upload CSV/XLSX. Bad rows fail with exact fixes — nothing half-saved."
        />
        <Feature
          step="02"
          title="Officers decide"
          body="Two district votes, quality for large batches, state has the final seal."
        />
        <Feature
          step="03"
          title="Public verify"
          body="Employers paste a cert number and know in seconds if it is genuine."
        />
      </section>
    </div>
  );
}

function Feature({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <p className="font-mono text-xs tracking-widest text-primary/70">{step}</p>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
