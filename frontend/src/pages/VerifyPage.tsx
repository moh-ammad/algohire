import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VerifyPage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Verify a certificate</CardTitle>
          <Badge variant="secondary">Public</Badge>
        </div>
        <CardDescription>
          No login. Wired in Task F6 after backend public verify (B6).
        </CardDescription>
      </CardHeader>
      <CardContent className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Form placeholder — enter cert number → valid / cancelled / not found.
      </CardContent>
    </Card>
  );
}
