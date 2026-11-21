import { useAuth } from "@/auth/AuthContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function QualityHomePage() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality review</CardTitle>
        <CardDescription>
          Signed in as {user?.name}. Large-batch scrutiny lands in F4.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
