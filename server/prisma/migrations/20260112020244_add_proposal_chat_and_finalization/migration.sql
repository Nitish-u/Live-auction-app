-- CreateEnum
CREATE TYPE "FinalizationStatus" AS ENUM ('PENDING', 'BOTH_CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ProposalMessage" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalFinalization" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "status" "FinalizationStatus" NOT NULL DEFAULT 'PENDING',
    "buyerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "sellerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "buyerConfirmedAt" TIMESTAMP(3),
    "sellerConfirmedAt" TIMESTAMP(3),
    "buyerDocsUrl" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sellerDocsUrl" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platformCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "buyerPaysCharge" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalFinalization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalMessage_proposalId_idx" ON "ProposalMessage"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalMessage_senderId_idx" ON "ProposalMessage"("senderId");

-- CreateIndex
CREATE INDEX "ProposalMessage_createdAt_idx" ON "ProposalMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalFinalization_proposalId_key" ON "ProposalFinalization"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalFinalization_status_idx" ON "ProposalFinalization"("status");

-- CreateIndex
CREATE INDEX "ProposalFinalization_proposalId_idx" ON "ProposalFinalization"("proposalId");

-- AddForeignKey
ALTER TABLE "ProposalMessage" ADD CONSTRAINT "ProposalMessage_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "BidProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalMessage" ADD CONSTRAINT "ProposalMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalFinalization" ADD CONSTRAINT "ProposalFinalization_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "BidProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
