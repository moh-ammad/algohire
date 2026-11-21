import { apiGet, apiPost } from "./client";
import type { AuthUser, LoginResponse } from "../auth/types";

export function loginRequest(email: string, password: string) {
  return apiPost<LoginResponse>("/api/auth/login", { email, password });
}

export function fetchMe(token: string) {
  return apiGet<{ user: AuthUser }>("/api/auth/me", token);
}
