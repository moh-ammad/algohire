import { apiGet, apiPost } from "./client";

export type StuckBatch = {
  id: string;
  reference: string;
  status: string;
  candidateCount: number;
  updatedAt: string;
  submittedAt: string | null;
  idleMinutes: number;
  centre: { id: string; name: string; code: string };
  flaggedAt: string | null;
};

export type TimelineEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export function listStuck(token: string) {
  return apiGet<{ thresholdMinutes: number; batches: StuckBatch[] }>(
    "/api/admin/stuck",
    token,
  );
}

export function scanStuck(token: string) {
  return apiPost<{
    stuckCount: number;
    newlyFlagged: number;
    thresholdMinutes: number;
    batches: StuckBatch[];
  }>("/api/admin/stuck/scan", {}, token);
}

export function getBatchTimeline(token: string, batchId: string) {
  return apiGet<{
    batch: {
      id: string;
      reference: string;
      status: string;
      centreName: string;
      updatedAt: string;
    };
    events: TimelineEvent[];
  }>(`/api/timeline/batches/${batchId}`, token);
}
