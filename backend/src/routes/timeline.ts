import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getBatchTimeline } from "../services/auditService.js";

export const timelineRouter = Router();

timelineRouter.get(
  "/timeline/batches/:id",
  requireAuth,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const data = await getBatchTimeline(req.user!, id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);
