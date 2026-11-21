import type { AuthUser } from "./types";

const TOKEN_KEY = "certiflow.token";
const USER_KEY = "certiflow.user";

export function loadSession(): { token: string; user: AuthUser } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  if (!token || !raw) return null;

  try {
    const user = JSON.parse(raw) as AuthUser;
    return { token, user };
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
