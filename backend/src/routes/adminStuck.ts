import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listStuckBatches,
  scanAndFlagStuckBatches,
} from "../services/stuckService.js";

export const adminStuckRouter = Router();

adminStuckRouter.use(requireAuth, requireRole("STATE"));

adminStuckRouter.get("/", async (_req, res, next) => {
  try {
    const batches = await listStuckBatches();
    res.json({
      thresholdMinutes: Number(process.env.STUCK_IDLE_MINUTES) || 1440,
      batches,
    });
  } catch (err) {
    next(err);
  }
});

adminStuckRouter.post("/scan", async (_req, res, next) => {
  try {
    const result = await scanAndFlagStuckBatches();
    const batches = await listStuckBatches();
    res.json({ ...result, batches });
  } catch (err) {
    next(err);
  }
});
