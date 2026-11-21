import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 3000,
  databaseUrl: required("DATABASE_URL"),
  redisUrl: required("REDIS_URL"),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  /** Batches idle in a review stage longer than this are "stuck" for State. */
  stuckIdleMinutes: Number(process.env.STUCK_IDLE_MINUTES) || 1440,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
} as const;
