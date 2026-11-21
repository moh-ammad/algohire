import { Router } from "express";
import { z } from "zod";
import { ApprovalDecision } from "../../generated/prisma/client.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  decideBatch,
  getInboxBatch,
  listInbox,
} from "../services/approvalService.js";

export const inboxRouter = Router();

inboxRouter.use(requireAuth, requireRole("DISTRICT", "QUALITY", "STATE"));

const decideSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "SEND_BACK"]),
  reason: z.string().trim().optional(),
});

inboxRouter.get("/", async (req, res, next) => {
  try {
    const batches = await listInbox(req.user!);
    res.json({ batches });
  } catch (err) {
    next(err);
  }
});

inboxRouter.get("/:batchId", async (req, res, next) => {
  try {
    const batch = await getInboxBatch(req.user!, req.params.batchId);
    res.json({ batch });
  } catch (err) {
    next(err);
  }
});

inboxRouter.post("/:batchId/decide", async (req, res, next) => {
  try {
    const parsed = decideSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "Invalid decision payload", "VALIDATION_ERROR");
    }

    const batch = await decideBatch(
      req.user!,
      req.params.batchId,
      parsed.data.decision as ApprovalDecision,
      parsed.data.reason,
    );

    res.json({ batch });
  } catch (err) {
    next(err);
  }
});
