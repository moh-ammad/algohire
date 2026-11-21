import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { DEMO_USERS } from "@/auth/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DemoSwitcher() {
  const { user, switching, loginAs, logout } = useAuth();

  async function switchTo(email: string, name: string) {
    try {
      await loginAs(email);
      toast.success(`Signed in as ${name}`, {
        description: "Role-based navigation updated.",
      });
    } catch {
      toast.error("Could not switch user", {
        description: "Is the API running on :3000?",
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Users className="size-3.5" />
                Demo users
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Switch reviewer personas instantly</TooltipContent>
        </Tooltip>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Demo personas</DialogTitle>
            <DialogDescription>
              Hackathon reviewers: one click switches JWT + role. Password is
              shared seed (`password123`).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            {DEMO_USERS.map((demo) => {
              const active = user?.email === demo.email;
              return (
                <button
                  key={demo.email}
                  type="button"
                  disabled={switching}
                  onClick={() => void switchTo(demo.email, demo.name)}
                  className={[
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-muted/60",
                    switching ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(demo.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {demo.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {demo.blurb} · {demo.email}
                    </span>
                  </span>
                  <Badge variant={active ? "default" : "secondary"}>
                    {demo.role}
                  </Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2">
              <Avatar size="sm">
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {user.name}
                <span className="text-muted-foreground"> · {user.role}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEMO_USERS.filter((d) => d.email !== user.email).map((demo) => (
              <DropdownMenuItem
                key={demo.email}
                disabled={switching}
                onClick={() => void switchTo(demo.email, demo.name)}
              >
                Switch to {demo.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                toast.message("Signed out");
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Badge variant="outline">Not signed in</Badge>
      )}
    </div>
  );
}
