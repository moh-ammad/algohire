import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../lib/redis.js";

/** Ops probes must never be rate-limited (load balancers / docker health). */
function isOpsPath(path: string): boolean {
  return path === "/health" || path === "/ready";
}

/** Global API limit — shared across instances via Redis (not in-memory). */
export const globalRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isOpsPath(req.path),
  message: {
    error: "Too many requests",
    code: "RATE_LIMITED",
  },
  store: new RedisStore({
    prefix: "rl:global:",
    sendCommand: (...args: string[]) =>
      redis.call(...args) as Promise<number>,
  }),
});

/** Stricter limit for public endpoints (verify/login) — wired in later tasks. */
export const publicRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    code: "RATE_LIMITED",
  },
  store: new RedisStore({
    prefix: "rl:public:",
    sendCommand: (...args: string[]) =>
      redis.call(...args) as Promise<number>,
  }),
});
