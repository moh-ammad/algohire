import { useAuth } from "@/auth/AuthContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CentreHomePage() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centre workspace</CardTitle>
        <CardDescription>
          Signed in as {user?.name}. Batch upload lands in Task F3 / B3.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
