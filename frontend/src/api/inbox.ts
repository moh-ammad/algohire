import { apiGet, apiPost } from "./client";
import type { BatchDetail, BatchStatus } from "./batches";

export type Decision = "APPROVE" | "REJECT" | "SEND_BACK";

export type InboxBatch = BatchDetail & {
  centre?: { id: string; code: string; name: string; districtId: string };
  approvals?: Array<{
    id: string;
    decision: Decision;
    stage: BatchStatus;
    reason: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string; role: string };
  }>;
  quorum: {
    required: number;
    approveCount: number;
    youVoted: boolean;
  };
};

export function listInbox(token: string) {
  return apiGet<{ batches: InboxBatch[] }>("/api/inbox", token);
}

export function getInboxBatch(token: string, batchId: string) {
  return apiGet<{ batch: InboxBatch }>(`/api/inbox/${batchId}`, token);
}

export function decideInbox(
  token: string,
  batchId: string,
  decision: Decision,
  reason?: string,
) {
  return apiPost<{ batch: InboxBatch }>(
    `/api/inbox/${batchId}/decide`,
    { decision, reason },
    token,
  );
}
