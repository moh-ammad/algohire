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
import { cn } from "@/lib/utils";
import { ChevronDown, Users } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_TONE: Record<string, string> = {
  CENTRE: "bg-sky-500/15 text-sky-900",
  DISTRICT: "bg-amber-500/15 text-amber-950",
  QUALITY: "bg-teal-500/15 text-teal-950",
  STATE: "bg-emerald-500/15 text-emerald-950",
};

export function DemoSwitcher() {
  const { user, switching, loginAs, logout } = useAuth();

  async function switchTo(email: string, name: string) {
    try {
      await loginAs(email);
      toast.success(`Signed in as ${name}`);
    } catch {
      toast.error("Could not switch user", {
        description: "Is the API running on :3000?",
      });
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 border-border/80 bg-background/80">
            <Users className="size-3.5" />
            <span className="hidden sm:inline">Demo users</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Who are you reviewing as?</DialogTitle>
            <DialogDescription>
              One-click JWT login. Walk Anika → Dev → Meera → Farah for the happy path.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-1 sm:grid-cols-2">
            {DEMO_USERS.map((demo) => {
              const active = user?.email === demo.email;
              return (
                <button
                  key={demo.email}
                  type="button"
                  disabled={switching}
                  onClick={() => void switchTo(demo.email, demo.name)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200",
                    active
                      ? "border-primary bg-accent shadow-sm"
                      : "border-border/80 hover:border-primary/40 hover:bg-muted/40",
                    switching && "opacity-60",
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(demo.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{demo.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {demo.blurb}
                    </span>
                  </span>
                  <Badge className={cn("border-0", ROLE_TONE[demo.role])}>
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
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-primary/10 text-foreground hover:bg-primary/15"
            >
              <Avatar size="sm">
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-36 truncate sm:inline">
                {user.name}
              </span>
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.role} · {user.email}
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
      ) : null}
    </div>
  );
}
