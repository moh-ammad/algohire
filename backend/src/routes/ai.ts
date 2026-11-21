import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { publicRateLimiter } from "../middleware/rateLimit.js";
import {
  briefBatchForOfficer,
  explainSpreadsheetErrors,
} from "../services/gemini.js";
import { getInboxBatch } from "../services/approvalService.js";

export const aiRouter = Router();

aiRouter.use(requireAuth, publicRateLimiter);

const errorsSchema = z.object({
  errors: z
    .array(
      z.object({
        row: z.number(),
        field: z.string().optional(),
        message: z.string(),
      }),
    )
    .min(1)
    .max(50),
});

aiRouter.post(
  "/explain-errors",
  requireRole("CENTRE"),
  async (req, res, next) => {
    try {
      const parsed = errorsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, "Invalid errors payload", "VALIDATION_ERROR");
      }
      const text = await explainSpreadsheetErrors(parsed.data.errors);
      res.json({ text });
    } catch (err) {
      next(err);
    }
  },
);

aiRouter.post(
  "/batch-brief",
  requireRole("DISTRICT", "QUALITY", "STATE"),
  async (req, res, next) => {
    try {
      const batchId = z.string().min(1).parse(req.body?.batchId);
      const batch = await getInboxBatch(req.user!, batchId);

      const text = await briefBatchForOfficer({
        reference: batch.reference,
        status: batch.status,
        centreName: batch.centre?.name ?? "Unknown centre",
        candidateCount: batch.candidateCount,
        requiresQuality: batch.requiresQuality,
        candidates: batch.candidates.map((c) => ({
          fullName: c.fullName,
          phone: c.phone,
          courseName: c.courseName,
        })),
        approvals: batch.approvals.map((a) => ({
          name: a.user.name,
          decision: a.decision,
          stage: a.stage,
        })),
      });

      res.json({ text });
    } catch (err) {
      next(err);
    }
  },
);
