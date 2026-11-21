import { BatchStatus, type Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  parseCandidateSpreadsheet,
  type CandidateRow,
} from "./spreadsheet.js";

/** Large batches need quality scrutiny (PLAN.md). */
export const QUALITY_THRESHOLD = 50;

const EDITABLE: BatchStatus[] = [BatchStatus.DRAFT, BatchStatus.SENT_BACK];

function makeReference(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BAT-${stamp}-${rand}`;
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorId: string;
    batchId: string;
    action: string;
    entityId: string;
    meta?: Prisma.InputJsonValue;
  },
) {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      batchId: input.batchId,
      action: input.action,
      entityType: "Batch",
      entityId: input.entityId,
      meta: input.meta,
    },
  });
}

export async function createDraftBatch(user: AuthUser) {
  if (!user.centreId) {
    throw new AppError(400, "Centre user is not linked to a training centre", "NO_CENTRE");
  }

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.batch.create({
      data: {
        reference: makeReference(),
        centreId: user.centreId!,
        status: BatchStatus.DRAFT,
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      batchId: created.id,
      action: "BATCH_CREATED",
      entityId: created.id,
      meta: { reference: created.reference },
    });

    return created;
  });

  return batch;
}

export async function listCentreBatches(user: AuthUser) {
  if (!user.centreId) {
    throw new AppError(400, "Centre user is not linked to a training centre", "NO_CENTRE");
  }

  return prisma.batch.findMany({
    where: { centreId: user.centreId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reference: true,
      status: true,
      candidateCount: true,
      requiresQuality: true,
      returnReason: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getCentreBatch(user: AuthUser, batchId: string) {
  if (!user.centreId) {
    throw new AppError(400, "Centre user is not linked to a training centre", "NO_CENTRE");
  }

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, centreId: user.centreId },
    include: {
      candidates: { orderBy: { rowNumber: "asc" } },
      centre: { select: { id: true, code: true, name: true } },
    },
  });

  if (!batch) {
    throw new AppError(404, "Batch not found", "BATCH_NOT_FOUND");
  }

  return batch;
}

async function assertEditableCentreBatch(user: AuthUser, batchId: string) {
  const batch = await getCentreBatch(user, batchId);
  if (!EDITABLE.includes(batch.status)) {
    throw new AppError(
      409,
      `Batch cannot be edited in status ${batch.status}`,
      "BATCH_NOT_EDITABLE",
    );
  }
  return batch;
}

/**
 * Moment 1: bad rows → detailed errors; nothing half-saved.
 * Replaces all candidates in one transaction only when every row is valid.
 */
export async function replaceCandidatesFromSpreadsheet(
  user: AuthUser,
  batchId: string,
  fileBuffer: Buffer,
) {
  const batch = await assertEditableCentreBatch(user, batchId);
  const { rows, errors } = parseCandidateSpreadsheet(fileBuffer);

  if (errors.length > 0) {
    throw new AppError(
      400,
      "Spreadsheet has validation errors — nothing was saved",
      "SPREADSHEET_INVALID",
      { errors },
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.candidate.deleteMany({ where: { batchId: batch.id } });

    if (rows.length > 0) {
      await tx.candidate.createMany({
        data: rows.map((r: CandidateRow) => ({
          batchId: batch.id,
          fullName: r.fullName,
          phone: r.phone,
          nationalId: r.nationalId,
          courseName: r.courseName,
          rowNumber: r.rowNumber,
        })),
      });
    }

    const updated = await tx.batch.update({
      where: { id: batch.id },
      data: {
        candidateCount: rows.length,
        requiresQuality: rows.length >= QUALITY_THRESHOLD,
        // Re-upload on SENT_BACK keeps SENT_BACK until submit
        status:
          batch.status === BatchStatus.SENT_BACK
            ? BatchStatus.SENT_BACK
            : BatchStatus.DRAFT,
      },
      include: {
        candidates: { orderBy: { rowNumber: "asc" } },
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      batchId: batch.id,
      action: "CANDIDATES_UPLOADED",
      entityId: batch.id,
      meta: { count: rows.length },
    });

    return updated;
  });
}

export async function submitBatch(user: AuthUser, batchId: string) {
  const batch = await assertEditableCentreBatch(user, batchId);

  if (batch.candidateCount < 1) {
    throw new AppError(
      400,
      "Upload at least one valid candidate before submitting",
      "NO_CANDIDATES",
    );
  }

  return prisma.$transaction(async (tx) => {
    // Clear prior approvals when resubmitting after SEND_BACK (PLAN decision)
    if (batch.status === BatchStatus.SENT_BACK) {
      await tx.approval.deleteMany({ where: { batchId: batch.id } });
    }

    const updated = await tx.batch.update({
      where: { id: batch.id },
      data: {
        status: BatchStatus.DISTRICT_REVIEW,
        submittedAt: new Date(),
        returnReason: null,
        requiresQuality: batch.candidateCount >= QUALITY_THRESHOLD,
      },
      include: {
        candidates: { orderBy: { rowNumber: "asc" } },
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      batchId: batch.id,
      action: "BATCH_SUBMITTED",
      entityId: batch.id,
      meta: {
        candidateCount: updated.candidateCount,
        requiresQuality: updated.requiresQuality,
        fromStatus: batch.status,
      },
    });

    return updated;
  });
}
