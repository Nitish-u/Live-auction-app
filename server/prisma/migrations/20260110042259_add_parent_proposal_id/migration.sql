-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED');

-- CreateTable
CREATE TABLE "BidProposal" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "proposedAmount" DECIMAL(65,30) NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "parentProposalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BidProposal_assetId_idx" ON "BidProposal"("assetId");

-- CreateIndex
CREATE INDEX "BidProposal_sellerId_idx" ON "BidProposal"("sellerId");

-- CreateIndex
CREATE INDEX "BidProposal_buyerId_idx" ON "BidProposal"("buyerId");

-- CreateIndex
CREATE INDEX "BidProposal_status_idx" ON "BidProposal"("status");

-- AddForeignKey
ALTER TABLE "BidProposal" ADD CONSTRAINT "BidProposal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidProposal" ADD CONSTRAINT "BidProposal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidProposal" ADD CONSTRAINT "BidProposal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
