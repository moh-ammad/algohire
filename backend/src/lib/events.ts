import { Queue } from "bullmq";
import { env } from "../config/env.js";

/** Domain events for workers (B5+). Failures are logged — request path stays fast. */
let eventsQueue: Queue | null = null;

function getQueue() {
  if (!eventsQueue) {
    eventsQueue = new Queue("certiflow-events", {
      connection: {
        url: env.redisUrl,
        maxRetriesPerRequest: null,
      },
    });
  }
  return eventsQueue;
}

export async function emitDomainEvent(
  type: string,
  payload: Record<string, unknown>,
) {
  try {
    await getQueue().add(
      type,
      { type, ...payload, at: new Date().toISOString() },
      { removeOnComplete: 500, removeOnFail: 200 },
    );
  } catch (err) {
    console.error("emitDomainEvent failed", type, err);
  }
}
