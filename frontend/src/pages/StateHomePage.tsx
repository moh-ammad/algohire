import { useAuth } from "@/auth/AuthContext";
import { StuckQueue } from "@/components/StuckQueue";
import { Separator } from "@/components/ui/separator";
import { InboxPage } from "./InboxPage";

export function StateHomePage() {
  const { token } = useAuth();

  return (
    <div className="space-y-10">
      {token ? <StuckQueue token={token} /> : null}
      <Separator />
      <InboxPage role="STATE" />
    </div>
  );
}
