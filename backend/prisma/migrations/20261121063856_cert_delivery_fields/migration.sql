-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "pdfReadyAt" TIMESTAMP(3),
ADD COLUMN     "waAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "waDeliveredAt" TIMESTAMP(3),
ADD COLUMN     "waLastError" TEXT;

-- CreateIndex
CREATE INDEX "Certificate_certNumber_idx" ON "Certificate"("certNumber");
