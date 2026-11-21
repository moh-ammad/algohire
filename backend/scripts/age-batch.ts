import { prisma } from "../src/lib/prisma.js";

const id = process.argv[2];
const days = Number(process.argv[3] ?? 3);

if (!id) {
  console.error("Usage: npx tsx scripts/age-batch.ts <batchId> [days]");
  process.exit(1);
}

await prisma.batch.update({
  where: { id },
  data: { updatedAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
});

console.log(`Aged batch ${id} by ${days} day(s)`);
await prisma.$disconnect();
