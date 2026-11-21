import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, Upload, Users } from "lucide-react";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Pragati Skills Mission
        </Badge>
        <div className="flex items-center gap-3">
          <BrandLogo showWordmark={false} markClassName="size-12" />
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            CertiFlow
          </h1>
        </div>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Issue skilling certificates with a clear approval chain — and let anyone
          verify a certificate is genuine in seconds.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/verify">Verify a certificate</Link>
          </Button>
          {!user ? (
            <Button variant="outline" asChild>
              <a href="#demo">Open demo users</a>
            </Button>
          ) : null}
        </div>
        {user ? (
          <p className="text-sm text-muted-foreground">
            Acting as <span className="font-medium text-foreground">{user.name}</span>{" "}
            ({user.role}). Use <strong>Demo users</strong> in the header to switch.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pick a demo persona from the header to unlock role workspaces.
          </p>
        )}
      </section>

      <section id="demo" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <Upload className="mb-1 size-5 text-primary" />
            <CardTitle>Centres submit</CardTitle>
            <CardDescription>
              Upload passed batches; bad rows fail cleanly with no half-saves.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Anika → Centre workspace
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Users className="mb-1 size-5 text-primary" />
            <CardTitle>Officers decide</CardTitle>
            <CardDescription>
              District quorum, quality for large batches, state has the final say.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Dev / Meera / Kabir / Neha / Farah
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="mb-1 size-5 text-primary" />
            <CardTitle>Anyone verifies</CardTitle>
            <CardDescription>
              Public check — no login. Cancelled certs never show as genuine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/verify">Go to verify →</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
