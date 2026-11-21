import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  enqueueDeliveriesForBatch,
  listCertificatesForBatch,
} from "../services/certificateService.js";
import { AppError } from "../middleware/errorHandler.js";

export const certificatesRouter = Router();

certificatesRouter.use(
  requireAuth,
  requireRole("CENTRE", "DISTRICT", "QUALITY", "STATE"),
);

certificatesRouter.get("/batch/:batchId", async (req, res, next) => {
  try {
    const certificates = await listCertificatesForBatch(
      req.user!,
      req.params.batchId,
    );
    res.json({
      certificates,
      summary: {
        total: certificates.length,
        delivered: certificates.filter((c) => c.status === "DELIVERED").length,
        issued: certificates.filter((c) => c.status === "ISSUED").length,
        cancelled: certificates.filter((c) => c.status === "CANCELLED").length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Re-queue undelivered WhatsApp jobs (idempotent job ids). */
certificatesRouter.post("/batch/:batchId/retry-delivery", async (req, res, next) => {
  try {
    if (req.user!.role !== "STATE" && req.user!.role !== "CENTRE") {
      throw new AppError(403, "Only centre/state can retry delivery", "FORBIDDEN");
    }
    await listCertificatesForBatch(req.user!, req.params.batchId);
    const count = await enqueueDeliveriesForBatch(req.params.batchId);
    res.json({ enqueued: count });
  } catch (err) {
    next(err);
  }
});
