import {
  ApprovalDecision,
  BatchStatus,
  Role,
  type Prisma,
} from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { emitDomainEvent } from "../lib/events.js";
import { broadcastBatchEvent } from "../lib/realtime.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthUser } from "../types/auth.js";
import { QUALITY_THRESHOLD } from "./batchService.js";
import {
  enqueueDeliveriesForBatch,
  issueCertificatesForBatch,
} from "./certificateService.js";

/** Brief: district decision needs more than one officer. */
export const DISTRICT_QUORUM = 2;

const batchInclude = {
  centre: { select: { id: true, code: true, name: true, districtId: true } },
  candidates: { orderBy: { rowNumber: "asc" as const } },
  approvals: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.BatchInclude;

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

function stageForRole(role: Role): BatchStatus | null {
  if (role === Role.DISTRICT) return BatchStatus.DISTRICT_REVIEW;
  if (role === Role.QUALITY) return BatchStatus.QUALITY_REVIEW;
  if (role === Role.STATE) return BatchStatus.STATE_REVIEW;
  return null;
}

function nextAfterDistrict(candidateCount: number): BatchStatus {
  return candidateCount >= QUALITY_THRESHOLD
    ? BatchStatus.QUALITY_REVIEW
    : BatchStatus.STATE_REVIEW;
}

export async function listInbox(user: AuthUser) {
  const stage = stageForRole(user.role);
  if (!stage) {
    throw new AppError(403, "No inbox for this role", "FORBIDDEN");
  }

  const where: Prisma.BatchWhereInput = { status: stage };

  if (user.role === Role.DISTRICT) {
    if (!user.districtId) {
      throw new AppError(400, "District officer has no district", "NO_DISTRICT");
    }
    where.centre = { districtId: user.districtId };
  }

  const batches = await prisma.batch.findMany({
    where,
    orderBy: { updatedAt: "asc" },
    include: {
      centre: { select: { id: true, code: true, name: true, districtId: true } },
      approvals: {
        where: { stage },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  return batches.map((b) => ({
    ...b,
    quorum: {
      required: user.role === Role.DISTRICT ? DISTRICT_QUORUM : 1,
      approveCount: b.approvals.filter((a) => a.decision === ApprovalDecision.APPROVE)
        .length,
      youVoted: b.approvals.some((a) => a.userId === user.id),
    },
  }));
}

export async function getInboxBatch(user: AuthUser, batchId: string) {
  const stage = stageForRole(user.role);
  if (!stage) {
    throw new AppError(403, "No inbox for this role", "FORBIDDEN");
  }

  const batch = await prisma.batch.findFirst({
    where: {
      id: batchId,
      ...(user.role === Role.DISTRICT && user.districtId
        ? { centre: { districtId: user.districtId } }
        : {}),
    },
    include: batchInclude,
  });

  if (!batch) {
    throw new AppError(404, "Batch not found", "BATCH_NOT_FOUND");
  }

  const stageApprovals = batch.approvals.filter((a) => a.stage === batch.status);

  return {
    ...batch,
    quorum: {
      required: batch.status === BatchStatus.DISTRICT_REVIEW ? DISTRICT_QUORUM : 1,
      approveCount: stageApprovals.filter(
        (a) => a.decision === ApprovalDecision.APPROVE,
      ).length,
      youVoted: stageApprovals.some((a) => a.userId === user.id),
    },
  };
}

export async function decideBatch(
  user: AuthUser,
  batchId: string,
  decision: ApprovalDecision,
  reason?: string,
) {
  const expectedStage = stageForRole(user.role);
  if (!expectedStage) {
    throw new AppError(403, "Your role cannot decide batches", "FORBIDDEN");
  }

  if (
    (decision === ApprovalDecision.REJECT ||
      decision === ApprovalDecision.SEND_BACK) &&
    (!reason || reason.trim().length < 3)
  ) {
    throw new AppError(
      400,
      "A reason (min 3 chars) is required for reject/send-back",
      "REASON_REQUIRED",
    );
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // Serialize concurrent district votes so quorum counts stay correct
      await tx.$executeRaw`SELECT id FROM "Batch" WHERE id = ${batchId} FOR UPDATE`;

      const batch = await tx.batch.findFirst({
        where: {
          id: batchId,
          ...(user.role === Role.DISTRICT && user.districtId
            ? { centre: { districtId: user.districtId } }
            : {}),
        },
        include: { centre: true },
      });

      if (!batch) {
        throw new AppError(404, "Batch not found", "BATCH_NOT_FOUND");
      }

      if (batch.status !== expectedStage) {
        throw new AppError(
          409,
          `Batch is in ${batch.status}; your role acts at ${expectedStage}`,
          "WRONG_STAGE",
        );
      }

      try {
        await tx.approval.create({
          data: {
            batchId: batch.id,
            userId: user.id,
            decision,
            stage: expectedStage,
            reason: reason?.trim() || null,
          },
        });
      } catch {
        // Unique (batchId, userId, stage) — concurrent double-click / second vote
        throw new AppError(
          409,
          "You already recorded a decision on this batch at this stage",
          "ALREADY_DECIDED",
        );
      }

      let nextStatus: BatchStatus = batch.status;
      let advanced = false;

      if (decision === ApprovalDecision.REJECT) {
        nextStatus = BatchStatus.REJECTED;
        advanced = true;
      } else if (decision === ApprovalDecision.SEND_BACK) {
        await tx.approval.deleteMany({ where: { batchId: batch.id } });
        nextStatus = BatchStatus.SENT_BACK;
        advanced = true;
      } else if (decision === ApprovalDecision.APPROVE) {
        if (expectedStage === BatchStatus.DISTRICT_REVIEW) {
          const approveCount = await tx.approval.count({
            where: {
              batchId: batch.id,
              stage: BatchStatus.DISTRICT_REVIEW,
              decision: ApprovalDecision.APPROVE,
            },
          });

          if (approveCount >= DISTRICT_QUORUM) {
            // Only one transaction wins the status move (safe under concurrency)
            const moved = await tx.batch.updateMany({
              where: { id: batch.id, status: BatchStatus.DISTRICT_REVIEW },
              data: {
                status: nextAfterDistrict(batch.candidateCount),
              },
            });
            if (moved.count === 1) {
              nextStatus = nextAfterDistrict(batch.candidateCount);
              advanced = true;
            } else {
              const fresh = await tx.batch.findUniqueOrThrow({
                where: { id: batch.id },
              });
              nextStatus = fresh.status;
            }
          }
        } else if (expectedStage === BatchStatus.QUALITY_REVIEW) {
          const moved = await tx.batch.updateMany({
            where: { id: batch.id, status: BatchStatus.QUALITY_REVIEW },
            data: { status: BatchStatus.STATE_REVIEW },
          });
          if (moved.count === 1) {
            nextStatus = BatchStatus.STATE_REVIEW;
            advanced = true;
          }
        } else if (expectedStage === BatchStatus.STATE_REVIEW) {
          const moved = await tx.batch.updateMany({
            where: { id: batch.id, status: BatchStatus.STATE_REVIEW },
            data: {
              status: BatchStatus.APPROVED,
              approvedAt: new Date(),
            },
          });
          if (moved.count === 1) {
            nextStatus = BatchStatus.APPROVED;
            advanced = true;
            // Moment 3: exactly one certificate per candidate
            await issueCertificatesForBatch(tx, batch.id);
          }
        }
      }

      if (
        advanced &&
        decision !== ApprovalDecision.APPROVE &&
        (decision === ApprovalDecision.REJECT ||
          decision === ApprovalDecision.SEND_BACK)
      ) {
        await tx.batch.update({
          where: { id: batch.id },
          data: {
            status: nextStatus,
            returnReason:
              decision === ApprovalDecision.SEND_BACK
                ? reason!.trim()
                : batch.returnReason,
          },
        });
      }

      await writeAudit(tx, {
        actorId: user.id,
        batchId: batch.id,
        action: `BATCH_${decision}`,
        entityId: batch.id,
        meta: {
          from: batch.status,
          to: nextStatus,
          reason: reason?.trim() || null,
          advanced,
        },
      });

      const full = await tx.batch.findUniqueOrThrow({
        where: { id: batch.id },
        include: batchInclude,
      });

      return { batch: full, from: batch.status, to: full.status, advanced };
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw err;
  }

  await emitDomainEvent("batch.status_changed", {
    batchId: result.batch.id,
    reference: result.batch.reference,
    from: result.from,
    to: result.to,
    decision,
    actorId: user.id,
  });

  broadcastBatchEvent("batch.status_changed", {
    batchId: result.batch.id,
    reference: result.batch.reference,
    from: result.from,
    to: result.to,
    decision,
    actorId: user.id,
    status: result.to,
  });

  if (
    decision === ApprovalDecision.APPROVE &&
    result.to === BatchStatus.APPROVED
  ) {
    try {
      const enqueued = await enqueueDeliveriesForBatch(result.batch.id);
      await emitDomainEvent("certificates.delivery_enqueued", {
        batchId: result.batch.id,
        count: enqueued,
      });
    } catch (err) {
      console.error("enqueue deliveries failed", err);
    }
  }

  const stageApprovals = result.batch.approvals.filter(
    (a) => a.stage === result.from || a.stage === result.batch.status,
  );

  return {
    ...result.batch,
    quorum: {
      required:
        result.from === BatchStatus.DISTRICT_REVIEW ? DISTRICT_QUORUM : 1,
      approveCount: result.batch.approvals.filter(
        (a) =>
          a.stage === BatchStatus.DISTRICT_REVIEW &&
          a.decision === ApprovalDecision.APPROVE,
      ).length,
      youVoted: stageApprovals.some((a) => a.userId === user.id),
    },
  };
}
