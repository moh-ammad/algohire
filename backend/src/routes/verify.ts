import { Router } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../lib/redis.js";
import { verifyCertificate } from "../services/verifyService.js";

/** Strict burst protection for public employer lookups. */
export const verifyRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many verification attempts — try again shortly",
    code: "RATE_LIMITED",
  },
  store: new RedisStore({
    prefix: "rl:verify:",
    sendCommand: (...args: string[]) =>
      redis.call(...args) as Promise<number>,
  }),
});

export const verifyRouter = Router();

verifyRouter.get("/:certNumber", verifyRateLimiter, async (req, res, next) => {
  try {
    const result = await verifyCertificate(req.params.certNumber);
    const http =
      result.status === "valid" ? 200 : result.status === "cancelled" ? 200 : 404;
    res.status(http).json(result);
  } catch (err) {
    next(err);
  }
});
