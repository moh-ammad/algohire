import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { spreadsheetUpload } from "../middleware/upload.js";
import {
  createDraftBatch,
  getCentreBatch,
  listCentreBatches,
  replaceCandidatesFromSpreadsheet,
  submitBatch,
} from "../services/batchService.js";

export const batchesRouter = Router();

batchesRouter.use(requireAuth, requireRole("CENTRE"));

batchesRouter.get("/", async (req, res, next) => {
  try {
    const batches = await listCentreBatches(req.user!);
    res.json({ batches });
  } catch (err) {
    next(err);
  }
});

batchesRouter.post("/", async (req, res, next) => {
  try {
    const batch = await createDraftBatch(req.user!);
    res.status(201).json({ batch });
  } catch (err) {
    next(err);
  }
});

batchesRouter.get("/:id", async (req, res, next) => {
  try {
    const batch = await getCentreBatch(req.user!, req.params.id);
    res.json({ batch });
  } catch (err) {
    next(err);
  }
});

batchesRouter.post("/:id/candidates", (req, res, next) => {
  spreadsheetUpload(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }

    void (async () => {
      try {
        if (!req.file) {
          throw new AppError(400, "Missing file field `file`", "NO_FILE");
        }

        const batch = await replaceCandidatesFromSpreadsheet(
          req.user!,
          req.params.id,
          req.file.buffer,
        );

        res.json({ batch });
      } catch (e) {
        next(e);
      }
    })();
  });
});

batchesRouter.post("/:id/submit", async (req, res, next) => {
  try {
    const batch = await submitBatch(req.user!, req.params.id);
    res.json({ batch });
  } catch (err) {
    next(err);
  }
});
