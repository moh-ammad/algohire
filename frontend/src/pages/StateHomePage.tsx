import { useAuth } from "@/auth/AuthContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StateHomePage() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>State office</CardTitle>
        <CardDescription>
          Signed in as {user?.name}. Final approval / cancel / stuck queues come
          later.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
