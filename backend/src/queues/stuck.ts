import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { env } from "../config/env.js";
import { scanAndFlagStuckBatches } from "../services/stuckService.js";

const connection: ConnectionOptions = {
  url: env.redisUrl,
  maxRetriesPerRequest: null,
};

export const STUCK_QUEUE = "stuck-scan";

let queue: Queue | null = null;

export function getStuckQueue() {
  if (!queue) {
    queue = new Queue(STUCK_QUEUE, { connection });
  }
  return queue;
}

export async function ensureStuckScanSchedule() {
  const q = getStuckQueue();
  // Every minute — threshold itself is STUCK_IDLE_MINUTES
  await q.upsertJobScheduler(
    "stuck-scan-repeat",
    { every: 60_000 },
    {
      name: "scan",
      data: {},
      opts: { removeOnComplete: 20, removeOnFail: 20 },
    },
  );
}

export function startStuckWorker() {
  const worker = new Worker(
    STUCK_QUEUE,
    async () => {
      const result = await scanAndFlagStuckBatches();
      if (result.newlyFlagged > 0) {
        console.log(
          `[stuck] flagged ${result.newlyFlagged} batch(es) (idle ≥ ${result.thresholdMinutes}m)`,
        );
      }
      return result;
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error("[stuck] job failed", job?.id, err.message);
  });

  void ensureStuckScanSchedule().catch((err) => {
    console.error("[stuck] schedule failed", err);
  });

  return worker;
}
