import { BatchStatus, type Prisma } from "../../generated/prisma/client.js";
import { env } from "../config/env.js";
import { emitDomainEvent } from "../lib/events.js";
import { prisma } from "../lib/prisma.js";
import { broadcastBatchEvent } from "../lib/realtime.js";

const REVIEW_STATUSES: BatchStatus[] = [
  BatchStatus.DISTRICT_REVIEW,
  BatchStatus.QUALITY_REVIEW,
  BatchStatus.STATE_REVIEW,
];

function idleCutoff() {
  return new Date(Date.now() - env.stuckIdleMinutes * 60 * 1000);
}

export type StuckBatchRow = {
  id: string;
  reference: string;
  status: BatchStatus;
  candidateCount: number;
  updatedAt: Date;
  submittedAt: Date | null;
  idleMinutes: number;
  centre: { id: string; name: string; code: string };
  flaggedAt: Date | null;
};

export async function listStuckBatches(): Promise<StuckBatchRow[]> {
  const cutoff = idleCutoff();
  const batches = await prisma.batch.findMany({
    where: {
      status: { in: REVIEW_STATUSES },
      updatedAt: { lt: cutoff },
    },
    include: {
      centre: { select: { id: true, name: true, code: true } },
      auditLogs: {
        where: { action: "BATCH_STUCK_FLAGGED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const now = Date.now();
  return batches.map((b) => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    candidateCount: b.candidateCount,
    updatedAt: b.updatedAt,
    submittedAt: b.submittedAt,
    idleMinutes: Math.floor((now - b.updatedAt.getTime()) / 60_000),
    centre: b.centre,
    flaggedAt: b.auditLogs[0]?.createdAt ?? null,
  }));
}

/**
 * Scan for idle review batches, write audit once per idle stretch, notify State.
 * Safe to run on a schedule from the worker.
 */
export async function scanAndFlagStuckBatches() {
  const stuck = await listStuckBatches();
  let newlyFlagged = 0;

  for (const batch of stuck) {
    if (batch.flaggedAt) {
      // Already flagged for this idle stretch (updatedAt older than flag? re-flag if moved then stuck again)
      const movedSinceFlag =
        batch.updatedAt.getTime() > batch.flaggedAt.getTime();
      if (!movedSinceFlag) continue;
    }

    await prisma.auditLog.create({
      data: {
        batchId: batch.id,
        action: "BATCH_STUCK_FLAGGED",
        entityType: "Batch",
        entityId: batch.id,
        meta: {
          status: batch.status,
          idleMinutes: batch.idleMinutes,
          thresholdMinutes: env.stuckIdleMinutes,
        } satisfies Prisma.InputJsonValue,
      },
    });

    newlyFlagged += 1;

    await emitDomainEvent("batch.stuck", {
      batchId: batch.id,
      reference: batch.reference,
      status: batch.status,
      idleMinutes: batch.idleMinutes,
    });

    broadcastBatchEvent("batch.stuck", {
      batchId: batch.id,
      reference: batch.reference,
      status: batch.status,
      idleMinutes: batch.idleMinutes,
    });
  }

  return { stuckCount: stuck.length, newlyFlagged, thresholdMinutes: env.stuckIdleMinutes };
}
