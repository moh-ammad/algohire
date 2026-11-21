import { Router } from "express";
import { adminCertificatesRouter } from "./adminCertificates.js";
import { aiRouter } from "./ai.js";
import { authRouter } from "./auth.js";
import { batchesRouter } from "./batches.js";
import { certificatesRouter } from "./certificates.js";
import { healthRouter } from "./health.js";
import { inboxRouter } from "./inbox.js";
import { verifyRouter } from "./verify.js";

export const routes = Router();

routes.use(healthRouter);
routes.use("/api/auth", authRouter);
routes.use("/api/batches", batchesRouter);
routes.use("/api/inbox", inboxRouter);
routes.use("/api/certificates", certificatesRouter);
routes.use("/api/admin/certificates", adminCertificatesRouter);
routes.use("/api/verify", verifyRouter);
routes.use("/api/ai", aiRouter);
