import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import type { Role } from "@/auth/types";
import { ApiStatus } from "@/components/ApiStatus";
import { BrandLogo } from "@/components/BrandLogo";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { buttonVariants } from "@/components/ui/button";
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
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 cf-grain" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 cf-mesh opacity-40" />

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BrandLogo />
            </Link>
            <nav className="hidden items-center gap-0.5 md:flex">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
          <div className="flex items-center gap-2">
            <ApiStatus />
            <DemoSwitcher />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                "shrink-0",
              )
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/verify"
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                "shrink-0",
              )
            }
          >
            Verify
          </NavLink>
          <RoleNav roles={["CENTRE"]} to="/centre" label="Centre" hint="Centre" />
          <RoleNav roles={["DISTRICT"]} to="/officer" label="Inbox" hint="Inbox" />
          <RoleNav roles={["QUALITY"]} to="/quality" label="Quality" hint="Quality" />
          <RoleNav roles={["STATE"]} to="/state" label="State" hint="State" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
