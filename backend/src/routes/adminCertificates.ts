import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { cancelCertificate } from "../services/verifyService.js";

export const adminCertificatesRouter = Router();

adminCertificatesRouter.use(requireAuth, requireRole("STATE"));

const cancelSchema = z.object({
  reason: z.string().trim().min(3),
});

adminCertificatesRouter.post("/:certNumber/cancel", async (req, res, next) => {
  try {
    const parsed = cancelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "Reason required (min 3 chars)", "VALIDATION_ERROR");
    }

    const cert = await cancelCertificate(
      req.user!,
      req.params.certNumber,
      parsed.data.reason,
    );

    res.json({
      certificate: {
        id: cert.id,
        certNumber: cert.certNumber,
        status: cert.status,
        cancelledAt: cert.cancelledAt,
        cancelReason: cert.cancelReason,
        candidateName: cert.candidate.fullName,
      },
    });
  } catch (err) {
    next(err);
  }
});
