import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginRequest } from "../api/auth";
import { clearSession, loadSession, saveSession } from "./storage";
import { DEMO_PASSWORD, type AuthUser, type Role } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  switching: boolean;
  error: string | null;
  loginAs: (email: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadSession();
  const [user, setUser] = useState<AuthUser | null>(initial?.user ?? null);
  const [token, setToken] = useState<string | null>(initial?.token ?? null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginAs = useCallback(async (email: string) => {
    setSwitching(true);
    setError(null);
    try {
      const res = await loginRequest(email, DEMO_PASSWORD);
      saveSession(res.token, res.user);
      setToken(res.token);
      setUser(res.user);
    } catch {
      setError("Could not switch user — is the API running?");
      throw new Error("login failed");
    } finally {
      setSwitching(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo(
    () => ({ user, token, switching, error, loginAs, logout, hasRole }),
    [user, token, switching, error, loginAs, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
