import {
  CertificateStatus,
  type Prisma,
} from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthUser } from "../types/auth.js";
import { enqueueWhatsAppDelivery } from "../queues/whatsapp.js";

function certNumberFor(batchReference: string, rowNumber: number) {
  const stamp = batchReference.replace(/[^A-Z0-9]/gi, "").slice(-8).toUpperCase();
  return `CF-${stamp}-${String(rowNumber).padStart(4, "0")}`;
}

/** Exactly one certificate per candidate — unique constraints enforce it. */
export async function issueCertificatesForBatch(
  tx: Prisma.TransactionClient,
  batchId: string,
) {
  const batch = await tx.batch.findUniqueOrThrow({
    where: { id: batchId },
    include: {
      candidates: { orderBy: { rowNumber: "asc" } },
      certificates: true,
    },
  });

  if (batch.certificates.length > 0) {
    return batch.certificates;
  }

  const now = new Date();
  const data = batch.candidates.map((c) => ({
    certNumber: certNumberFor(batch.reference, c.rowNumber),
    candidateId: c.id,
    batchId: batch.id,
    status: CertificateStatus.ISSUED,
    issuedAt: now,
    pdfReadyAt: now, // mock PDF generation (instant stand-in)
  }));

  if (data.length === 0) return [];

  await tx.certificate.createMany({ data });

  await tx.auditLog.create({
    data: {
      batchId: batch.id,
      action: "CERTIFICATES_ISSUED",
      entityType: "Batch",
      entityId: batch.id,
      meta: { count: data.length },
    },
  });

  return tx.certificate.findMany({ where: { batchId: batch.id } });
}

export async function enqueueDeliveriesForBatch(batchId: string) {
  const certs = await prisma.certificate.findMany({
    where: {
      batchId,
      status: { in: [CertificateStatus.ISSUED, CertificateStatus.PENDING] },
      cancelledAt: null,
    },
    select: { id: true },
  });

  for (const cert of certs) {
    await enqueueWhatsAppDelivery(cert.id);
  }

  return certs.length;
}

export async function listCertificatesForBatch(user: AuthUser, batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { centre: true },
  });

  if (!batch) {
    throw new AppError(404, "Batch not found", "BATCH_NOT_FOUND");
  }

  const allowed =
    (user.role === "CENTRE" && user.centreId === batch.centreId) ||
    user.role === "STATE" ||
    user.role === "QUALITY" ||
    (user.role === "DISTRICT" &&
      user.districtId &&
      batch.centre.districtId === user.districtId);

  if (!allowed) {
    throw new AppError(403, "Cannot view certificates for this batch", "FORBIDDEN");
  }

  return prisma.certificate.findMany({
    where: { batchId },
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          courseName: true,
          rowNumber: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
