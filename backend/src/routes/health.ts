import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { pingRedis } from "../lib/redis.js";

export const healthRouter = Router();

/** Liveness — process is up. No dependency checks. */
healthRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/** Readiness — Postgres + Redis must respond. */
healthRouter.get("/ready", async (_req, res) => {
  const checks: Record<string, "ok" | "fail"> = {
    postgres: "fail",
    redis: "fail",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = "ok";
  } catch (err) {
    console.error("ready: postgres failed", err);
  }

  try {
    checks.redis = (await pingRedis()) ? "ok" : "fail";
  } catch (err) {
    console.error("ready: redis failed", err);
  }

  const ready = checks.postgres === "ok" && checks.redis === "ok";

  res.status(ready ? 200 : 503).json({
    ok: ready,
    checks,
  });
});
