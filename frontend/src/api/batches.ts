import { API_URL, ApiError, apiGet, apiPost } from "./client";

export type BatchStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "DISTRICT_REVIEW"
  | "QUALITY_REVIEW"
  | "STATE_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SENT_BACK";

export type Candidate = {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string | null;
  courseName: string;
  rowNumber: number;
};

export type BatchSummary = {
  id: string;
  reference: string;
  status: BatchStatus;
  candidateCount: number;
  requiresQuality: boolean;
  returnReason: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BatchDetail = BatchSummary & {
  centreId: string;
  candidates: Candidate[];
  centre?: { id: string; code: string; name: string };
};

export type SpreadsheetError = {
  row: number;
  field?: string;
  message: string;
};

export function listBatches(token: string) {
  return apiGet<{ batches: BatchSummary[] }>("/api/batches", token);
}

export function createBatch(token: string) {
  return apiPost<{ batch: BatchSummary }>("/api/batches", {}, token);
}

export function getBatch(token: string, id: string) {
  return apiGet<{ batch: BatchDetail }>(`/api/batches/${id}`, token);
}

export function submitBatch(token: string, id: string) {
  return apiPost<{ batch: BatchDetail }>(`/api/batches/${id}/submit`, {}, token);
}

export async function uploadCandidates(
  token: string,
  id: string,
  file: File,
): Promise<{ batch: BatchDetail }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/batches/${id}/candidates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: form,
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status}`, res.status, body);
  }

  return body as { batch: BatchDetail };
}
