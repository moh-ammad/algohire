import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { CertificateStatus } from "../../generated/prisma/client.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const connection: ConnectionOptions = {
  url: env.redisUrl,
  maxRetriesPerRequest: null,
};

export const WHATSAPP_QUEUE = "whatsapp-delivery";

let queue: Queue | null = null;

export function getWhatsAppQueue() {
  if (!queue) {
    queue = new Queue(WHATSAPP_QUEUE, { connection });
  }
  return queue;
}

/** Idempotent job id — re-enqueue won't duplicate logical delivery jobs. */
export async function enqueueWhatsAppDelivery(certificateId: string) {
  await getWhatsAppQueue().add(
    "deliver",
    { certificateId },
    {
      jobId: `wa-${certificateId}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 1500 },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
  );
}

/**
 * Stand-in WhatsApp provider: randomly succeeds, fails, or times out.
 * Set WHATSAPP_MOCK_MODE=always_ok | always_fail for demos.
 */
export async function mockWhatsAppSend(phone: string, certNumber: string) {
  const mode = process.env.WHATSAPP_MOCK_MODE ?? "flaky";

  if (mode === "always_ok") {
    return { providerId: `mock-ok-${certNumber}` };
  }
  if (mode === "always_fail") {
    throw new Error("WhatsApp provider rejected message");
  }

  await new Promise((r) => setTimeout(r, 80 + Math.floor(Math.random() * 120)));

  const roll = Math.random();
  if (roll < 0.2) {
    const err = new Error("WhatsApp timeout");
    (err as Error & { timeout?: boolean }).timeout = true;
    throw err;
  }
  if (roll < 0.35) {
    throw new Error(`WhatsApp send failed for ${phone}`);
  }

  return { providerId: `mock-${Date.now()}-${certNumber.slice(-4)}` };
}

export function startWhatsAppWorker() {
  const worker = new Worker(
    WHATSAPP_QUEUE,
    async (job) => {
      const certificateId = String(job.data.certificateId);
      const cert = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: { candidate: true },
      });

      if (!cert) return { skipped: true, reason: "missing" };
      if (cert.status === CertificateStatus.CANCELLED) {
        return { skipped: true, reason: "cancelled" };
      }
      if (cert.status === CertificateStatus.DELIVERED) {
        return { skipped: true, reason: "already_delivered" };
      }

      try {
        const result = await mockWhatsAppSend(
          cert.candidate.phone,
          cert.certNumber,
        );

        await prisma.certificate.update({
          where: { id: cert.id },
          data: {
            status: CertificateStatus.DELIVERED,
            waDeliveredAt: new Date(),
            waAttempts: { increment: 1 },
            waLastError: null,
          },
        });

        return { ok: true, providerId: result.providerId };
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        await prisma.certificate.update({
          where: { id: cert.id },
          data: {
            waAttempts: { increment: 1 },
            waLastError: message.slice(0, 300),
          },
        });
        throw err;
      }
    },
    { connection, concurrency: 5 },
  );

  worker.on("completed", (job) => {
    console.log(`[wa] delivered job ${job.id}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[wa] failed job ${job?.id}:`, err.message);
  });

  console.log("WhatsApp mock worker listening");
  return worker;
}
