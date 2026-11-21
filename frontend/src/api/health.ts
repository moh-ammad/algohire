import { apiGet } from "./client";

export type ReadyResponse = {
  ok: boolean;
  checks: {
    postgres: "ok" | "fail";
    redis: "ok" | "fail";
  };
};

export function fetchReady() {
  return apiGet<ReadyResponse>("/ready");
}

export function fetchHealth() {
  return apiGet<{ ok: boolean }>("/health");
}
