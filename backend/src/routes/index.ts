import { Router } from "express";
import { authRouter } from "./auth.js";
import { healthRouter } from "./health.js";

export const routes = Router();

routes.use(healthRouter);
routes.use("/api/auth", authRouter);
