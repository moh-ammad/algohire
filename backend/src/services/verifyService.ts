import { CertificateStatus } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthUser } from "../types/auth.js";

const CACHE_TTL_SEC = 60;
const cacheKey = (certNumber: string) =>
  `verify:${certNumber.trim().toUpperCase()}`;

export type VerifyResult = {
  status: "valid" | "cancelled" | "not_found";
  certNumber: string;
  candidateName?: string;
  courseName?: string;
  issuedAt?: string | null;
  centreName?: string;
  message: string;
};

function publicPayload(row: {
  certNumber: string;
  status: CertificateStatus;
  issuedAt: Date | null;
  cancelledAt: Date | null;
  candidate: { fullName: string; courseName: string };
  batch: { centre: { name: string } };
}): VerifyResult {
  if (
    row.status === CertificateStatus.CANCELLED ||
    row.cancelledAt != null
  ) {
    return {
      status: "cancelled",
      certNumber: row.certNumber,
      message: "This certificate was cancelled and is not valid.",
    };
  }

  // ISSUED or DELIVERED count as genuine for employers
  if (
    row.status === CertificateStatus.ISSUED ||
    row.status === CertificateStatus.DELIVERED
  ) {
    return {
      status: "valid",
      certNumber: row.certNumber,
      candidateName: row.candidate.fullName,
      courseName: row.candidate.courseName,
      issuedAt: row.issuedAt?.toISOString() ?? null,
      centreName: row.batch.centre.name,
      message: "Certificate is genuine.",
    };
  }

  // PENDING shouldn't normally appear publicly
  return {
    status: "not_found",
    certNumber: row.certNumber,
    message: "No genuine certificate found for this number.",
  };
}

export async function verifyCertificate(
  rawNumber: string,
): Promise<VerifyResult> {
  const certNumber = rawNumber.trim().toUpperCase();
  if (!certNumber || certNumber.length < 4) {
    throw new AppError(400, "Enter a valid certificate number", "INVALID_CERT");
  }

  const cached = await redis.get(cacheKey(certNumber));
  if (cached) {
    return JSON.parse(cached) as VerifyResult;
  }

  const row = await prisma.certificate.findUnique({
    where: { certNumber },
    include: {
      candidate: { select: { fullName: true, courseName: true } },
      batch: { include: { centre: { select: { name: true } } } },
    },
  });

  const result: VerifyResult = row
    ? publicPayload(row)
    : {
        status: "not_found",
        certNumber,
        message: "No certificate found for this number.",
      };

  // Cache all outcomes briefly (including not_found) to absorb bursts
  await redis.set(cacheKey(certNumber), JSON.stringify(result), "EX", CACHE_TTL_SEC);
  return result;
}

export async function invalidateVerifyCache(certNumber: string) {
  await redis.del(cacheKey(certNumber));
}

export async function cancelCertificate(
  user: AuthUser,
  certNumberRaw: string,
  reason: string,
) {
  if (user.role !== "STATE") {
    throw new AppError(403, "Only state office can cancel", "FORBIDDEN");
  }
  if (!reason || reason.trim().length < 3) {
    throw new AppError(400, "Cancellation reason required", "REASON_REQUIRED");
  }

  const certNumber = certNumberRaw.trim().toUpperCase();
  const cert = await prisma.certificate.findUnique({
    where: { certNumber },
  });

  if (!cert) {
    throw new AppError(404, "Certificate not found", "NOT_FOUND");
  }
  if (cert.status === CertificateStatus.CANCELLED) {
    throw new AppError(409, "Already cancelled", "ALREADY_CANCELLED");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.certificate.update({
      where: { id: cert.id },
      data: {
        status: CertificateStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason.trim(),
      },
      include: {
        candidate: { select: { fullName: true, courseName: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        batchId: row.batchId,
        action: "CERTIFICATE_CANCELLED",
        entityType: "Certificate",
        entityId: row.id,
        meta: { certNumber: row.certNumber, reason: reason.trim() },
      },
    });

    return row;
  });

  await invalidateVerifyCache(certNumber);
  return updated;
}
