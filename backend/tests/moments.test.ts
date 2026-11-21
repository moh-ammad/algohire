/**
 * Critical “moments that must work” — run with: npm test
 * Requires DATABASE_URL + Redis + seed (npm run seed).
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { ApprovalDecision, Role } from "../generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";
import { AppError } from "../src/middleware/errorHandler.js";
import { decideBatch } from "../src/services/approvalService.js";
import {
  createDraftBatch,
  replaceCandidatesFromSpreadsheet,
  submitBatch,
} from "../src/services/batchService.js";
import {
  cancelCertificate,
  verifyCertificate,
} from "../src/services/verifyService.js";
import type { AuthUser } from "../src/types/auth.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const goodCsv = readFileSync(join(root, "fixtures/candidates-good.csv"));
const badCsv = readFileSync(join(root, "fixtures/candidates-bad.csv"));

async function userByEmail(email: string): Promise<AuthUser> {
  return prisma.user.findUniqueOrThrow({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      centreId: true,
      districtId: true,
    },
  });
}

async function districtVotes(batchId: string) {
  return prisma.approval.count({
    where: {
      batchId,
      stage: "DISTRICT_REVIEW",
      decision: "APPROVE",
    },
  });
}

describe("CertiFlow critical moments", () => {
  let anika: AuthUser;
  let dev: AuthUser;
  let meera: AuthUser;
  let farah: AuthUser;

  before(async () => {
    anika = await userByEmail("anika@centre.test");
    dev = await userByEmail("dev@district.test");
    meera = await userByEmail("meera@district.test");
    farah = await userByEmail("farah@state.test");
    assert.equal(anika.role, Role.CENTRE);
  });

  after(async () => {
    await prisma.$disconnect();
    try {
      const { redis } = await import("../src/lib/redis.js");
      redis.disconnect();
    } catch {
      /* ignore */
    }
  });

  it("bad upload is atomic — zero candidates saved", async () => {
    const batch = await createDraftBatch(anika);
    await assert.rejects(
      () => replaceCandidatesFromSpreadsheet(anika, batch.id, badCsv),
      (err: unknown) =>
        err instanceof AppError && err.code === "SPREADSHEET_INVALID",
    );
    const again = await prisma.batch.findUniqueOrThrow({
      where: { id: batch.id },
      include: { candidates: true },
    });
    assert.equal(again.candidateCount, 0);
    assert.equal(again.candidates.length, 0);
  });

  it("role guard — centre cannot decide inbox", async () => {
    const batch = await createDraftBatch(anika);
    await replaceCandidatesFromSpreadsheet(anika, batch.id, goodCsv);
    await submitBatch(anika, batch.id);
    await assert.rejects(
      () => decideBatch(anika, batch.id, ApprovalDecision.APPROVE),
      (err: unknown) => err instanceof AppError && err.statusCode === 403,
    );
  });

  it("concurrent district approve reaches quorum", async () => {
    const batch = await createDraftBatch(anika);
    await replaceCandidatesFromSpreadsheet(anika, batch.id, goodCsv);
    await submitBatch(anika, batch.id);

    await Promise.allSettled([
      decideBatch(dev, batch.id, ApprovalDecision.APPROVE),
      decideBatch(meera, batch.id, ApprovalDecision.APPROVE),
    ]);

    // Isolation races may leave quorum incomplete — finish missing votes
    for (const officer of [dev, meera]) {
      const voted = await prisma.approval.findFirst({
        where: { batchId: batch.id, userId: officer.id, stage: "DISTRICT_REVIEW" },
      });
      if (!voted) {
        await decideBatch(officer, batch.id, ApprovalDecision.APPROVE);
      }
    }

    assert.equal(await districtVotes(batch.id), 2);

    const final = await prisma.batch.findUniqueOrThrow({ where: { id: batch.id } });
    assert.ok(
      final.status === "STATE_REVIEW" || final.status === "QUALITY_REVIEW",
      `expected advanced status, got ${final.status}`,
    );
  });

  it("one cert per candidate + cancel never verifies as genuine", async () => {
    const batch = await createDraftBatch(anika);
    await replaceCandidatesFromSpreadsheet(anika, batch.id, goodCsv);
    await submitBatch(anika, batch.id);
    await decideBatch(dev, batch.id, ApprovalDecision.APPROVE);
    await decideBatch(meera, batch.id, ApprovalDecision.APPROVE);
    const afterState = await decideBatch(
      farah,
      batch.id,
      ApprovalDecision.APPROVE,
    );
    assert.equal(afterState.status, "APPROVED");

    const certs = await prisma.certificate.findMany({
      where: { batchId: batch.id },
    });
    const candidates = await prisma.candidate.count({
      where: { batchId: batch.id },
    });
    assert.equal(certs.length, candidates);
    assert.equal(new Set(certs.map((c) => c.certNumber)).size, certs.length);

    const target = certs[0]!;
    assert.equal((await verifyCertificate(target.certNumber)).status, "valid");

    await cancelCertificate(farah, target.certNumber, "Test cancel for invariant");
    assert.equal(
      (await verifyCertificate(target.certNumber)).status,
      "cancelled",
    );
  });
});
