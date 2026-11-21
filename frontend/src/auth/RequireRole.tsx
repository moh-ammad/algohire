import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
