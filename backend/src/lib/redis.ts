import Redis from "ioredis";
import { env } from "../config/env.js";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export const redis =
  globalForRedis.redis ??
  new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

if (env.nodeEnv !== "production") {
  globalForRedis.redis = redis;
}

export async function pingRedis(): Promise<boolean> {
  const result = await redis.ping();
  return result === "PONG";
}
