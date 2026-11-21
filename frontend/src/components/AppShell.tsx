import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import type { Role } from "@/auth/types";
import { ApiStatus } from "@/components/ApiStatus";
import { BrandLogo } from "@/components/BrandLogo";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function RoleNav({
  roles,
  to,
  label,
  hint,
}: {
  roles: Role[];
  to: string;
  label: string;
  hint: string;
}) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          className={({ isActive }) =>
            cn(
              buttonVariants({
                variant: isActive ? "secondary" : "ghost",
                size: "sm",
              }),
            )
          }
        >
          {label}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

export function AppShell() {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.03_170)_0%,_transparent_55%)]"
      />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <Link
                to="/"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BrandLogo />
              </Link>
              <Separator orientation="vertical" className="hidden h-6 sm:block" />
              <nav className="flex flex-wrap items-center gap-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    cn(
                      buttonVariants({
                        variant: isActive ? "secondary" : "ghost",
                        size: "sm",
                      }),
                    )
                  }
                >
                  Home
                </NavLink>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/verify"
                      className={({ isActive }) =>
                        cn(
                          buttonVariants({
                            variant: isActive ? "secondary" : "ghost",
                            size: "sm",
                          }),
                        )
                      }
                    >
                      Verify
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent>Public — no login</TooltipContent>
                </Tooltip>
                <RoleNav
                  roles={["CENTRE"]}
                  to="/centre"
                  label="Centre"
                  hint="Upload and track batches"
                />
                <RoleNav
                  roles={["DISTRICT"]}
                  to="/officer"
                  label="Inbox"
                  hint="District approval queue"
                />
                <RoleNav
                  roles={["QUALITY"]}
                  to="/quality"
                  label="Quality"
                  hint="Large-batch scrutiny"
                />
                <RoleNav
                  roles={["STATE"]}
                  to="/state"
                  label="State"
                  hint="Final say"
                />
              </nav>
            </div>
            <ApiStatus />
          </div>
          <DemoSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
