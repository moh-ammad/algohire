import { apiGet } from "./client";

export type CertificateRow = {
  id: string;
  certNumber: string;
  status: "PENDING" | "ISSUED" | "DELIVERED" | "CANCELLED";
  issuedAt: string | null;
  waAttempts: number;
  waLastError: string | null;
  waDeliveredAt: string | null;
  candidate: {
    id: string;
    fullName: string;
    phone: string;
    courseName: string;
    rowNumber: number;
  };
};

export function listBatchCertificates(token: string, batchId: string) {
  return apiGet<{
    certificates: CertificateRow[];
    summary: {
      total: number;
      delivered: number;
      issued: number;
      cancelled: number;
    };
  }>(`/api/certificates/batch/${batchId}`, token);
}
