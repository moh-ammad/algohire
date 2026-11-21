import { Link, NavLink, Outlet } from "react-router-dom";
import { ApiStatus } from "./ApiStatus";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-[var(--accent-bg)] text-[var(--text-h)]"
      : "text-[var(--text)] hover:bg-[var(--panel)] hover:text-[var(--text-h)]",
  ].join(" ");

export function AppShell() {
  return (
    <div className="min-h-svh bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold tracking-tight text-[var(--text-h)]">
              CertiFlow
            </Link>
            <nav className="flex gap-1">
              <NavLink to="/" end className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/verify" className={linkClass}>
                Verify
              </NavLink>
            </nav>
          </div>
          <ApiStatus />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
