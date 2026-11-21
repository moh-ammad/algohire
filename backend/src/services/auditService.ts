import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthUser } from "../types/auth.js";

export async function getBatchTimeline(user: AuthUser, batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      reference: true,
      status: true,
      centreId: true,
      updatedAt: true,
      centre: { select: { districtId: true, name: true } },
    },
  });

  if (!batch) {
    throw new AppError(404, "Batch not found", "NOT_FOUND");
  }

  if (user.role === Role.CENTRE) {
    if (!user.centreId || batch.centreId !== user.centreId) {
      throw new AppError(403, "Not your centre's batch", "FORBIDDEN");
    }
  } else if (user.role === Role.DISTRICT) {
    if (!user.districtId || batch.centre.districtId !== user.districtId) {
      throw new AppError(403, "Outside your district", "FORBIDDEN");
    }
  }
  // QUALITY + STATE: all batches

  const events = await prisma.auditLog.findMany({
    where: { batchId },
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    batch: {
      id: batch.id,
      reference: batch.reference,
      status: batch.status,
      centreName: batch.centre.name,
      updatedAt: batch.updatedAt,
    },
    events: events.map((e) => ({
      id: e.id,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      meta: e.meta,
      createdAt: e.createdAt,
      actor: e.actor,
    })),
  };
}
