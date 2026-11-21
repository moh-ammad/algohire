import { apiPost } from "./client";
import type { SpreadsheetError } from "./batches";

export function explainErrors(token: string, errors: SpreadsheetError[]) {
  return apiPost<{ text: string }>("/api/ai/explain-errors", { errors }, token);
}

export function batchBrief(token: string, batchId: string) {
  return apiPost<{ text: string }>("/api/ai/batch-brief", { batchId }, token);
}
