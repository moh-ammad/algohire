import { API_URL, ApiError } from "./client";

export type VerifyResult = {
  status: "valid" | "cancelled" | "not_found";
  certNumber: string;
  candidateName?: string;
  courseName?: string;
  issuedAt?: string | null;
  centreName?: string;
  message: string;
};

export async function verifyCertificate(
  certNumber: string,
): Promise<VerifyResult> {
  const res = await fetch(
    `${API_URL}/api/verify/${encodeURIComponent(certNumber.trim())}`,
    { headers: { Accept: "application/json" } },
  );

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  // 404 still returns JSON body with not_found
  if (body && typeof body === "object" && "status" in body) {
    return body as VerifyResult;
  }

  if (!res.ok) {
    throw new ApiError(`Verify failed: ${res.status}`, res.status, body);
  }

  return body as VerifyResult;
}

export function cancelCertificate(
  token: string,
  certNumber: string,
  reason: string,
) {
  return fetch(
    `${API_URL}/api/admin/certificates/${encodeURIComponent(certNumber)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ reason }),
    },
  ).then(async (res) => {
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(`Cancel failed: ${res.status}`, res.status, body);
    }
    return body as {
      certificate: {
        certNumber: string;
        status: string;
        cancelReason: string | null;
      };
    };
  });
}
