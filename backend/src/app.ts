import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { globalRateLimiter } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";
import { routes } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestId);
  app.use(globalRateLimiter);

  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
