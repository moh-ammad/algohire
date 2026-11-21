import { Router } from "express";
import { authRouter } from "./auth.js";
import { batchesRouter } from "./batches.js";
import { healthRouter } from "./health.js";

export const routes = Router();

routes.use(healthRouter);
routes.use("/api/auth", authRouter);
routes.use("/api/batches", batchesRouter);
