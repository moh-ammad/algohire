import { useAuth } from "@/auth/AuthContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OfficerHomePage() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Officer inbox</CardTitle>
        <CardDescription>
          Signed in as {user?.name} ({user?.role}). Approvals land in Task F4.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
