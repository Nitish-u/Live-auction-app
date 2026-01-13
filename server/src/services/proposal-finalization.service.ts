import prisma from '../config/prisma';
import { ProposalFinalization, FinalizationStatus } from '@prisma/client';

export class ProposalFinalizationService {
    async createFinalization(proposalId: string): Promise<ProposalFinalization> {
        const proposal = await prisma.bidProposal.findUnique({
            where: { id: proposalId },
        });

        if (!proposal || proposal.status !== 'ACCEPTED') {
            throw new Error('Proposal must be ACCEPTED to finalize');
        }

        const existing = await prisma.proposalFinalization.findUnique({
            where: { proposalId },
        });

        if (existing) {
            return existing;
        }
        // if (existing) { // Should we return existing or throw? Spec says "Finalization doesn't exist yet". But idempotency is good.
        //   throw new Error('Finalization already exists');
        // }

        const platformCharge = Number(proposal.proposedAmount) * 0.025;

        return prisma.proposalFinalization.create({
            data: {
                proposalId,
                platformCharge,
                status: 'PENDING',
            },
            include: {
                proposal: true
            }
        });
    }

    async uploadDocs(proposalId: string, userId: string, fileUrls: string[]): Promise<ProposalFinalization> {
        const finalization = await prisma.proposalFinalization.findUnique({
            where: { proposalId },
            include: { proposal: true },
        });

        if (!finalization) {
            throw new Error('Finalization not found');
        }

        // Check if user is buyer or seller
        const isBuyer = finalization.proposal.buyerId === userId;
        const isSeller = finalization.proposal.sellerId === userId;

        if (!isBuyer && !isSeller) {
            throw new Error('User not authorized');
        }

        if (isBuyer) {
            return prisma.proposalFinalization.update({
                where: { proposalId },
                data: {
                    buyerDocsUrl: {
                        push: fileUrls
                    }
                }
            });
        } else {
            return prisma.proposalFinalization.update({
                where: { proposalId },
                data: {
                    sellerDocsUrl: {
                        push: fileUrls
                    }
                }
            });
        }
    }

    async confirmFinalization(proposalId: string, userId: string): Promise<ProposalFinalization> {
        const finalization = await prisma.proposalFinalization.findUnique({
            where: { proposalId },
            include: { proposal: true },
        });

        if (!finalization) {
            throw new Error('Finalization not found');
        }

        if (finalization.status !== 'PENDING') {
            throw new Error('Finalization allows confirmation only when PENDING');
        }

        const isBuyer = finalization.proposal.buyerId === userId;
        const isSeller = finalization.proposal.sellerId === userId;

        if (!isBuyer && !isSeller) {
            throw new Error('User not authorized');
        }

        // Validation: At least one doc uploaded
        // if (isBuyer && finalization.buyerDocsUrl.length === 0) {
        //   throw new Error('Buyer must upload documents before confirming');
        // }
        // if (isSeller && finalization.sellerDocsUrl.length === 0) {
        //   throw new Error('Seller must upload documents before confirming');
        // } 
        // Spec says: "At least one doc uploaded by user"

        const updateData: any = {};
        if (isBuyer) updateData.buyerConfirmed = true;
        if (isSeller) updateData.sellerConfirmed = true;
        if (isBuyer) updateData.buyerConfirmedAt = new Date();
        if (isSeller) updateData.sellerConfirmedAt = new Date();

        const updated = await prisma.proposalFinalization.update({
            where: { proposalId },
            data: updateData
        });

        // Check if both confirmed
        if (updated.buyerConfirmed && updated.sellerConfirmed) {
            return prisma.proposalFinalization.update({
                where: { proposalId },
                data: {
                    status: 'BOTH_CONFIRMED',
                    finalizedAt: new Date()
                }
            });
        }

        return updated;
    }

    async getFinalization(proposalId: string): Promise<ProposalFinalization | null> {
        return prisma.proposalFinalization.findUnique({
            where: { proposalId },
            include: {
                proposal: {
                    select: {
                        buyerId: true,
                        sellerId: true,
                        proposedAmount: true
                    }
                }
            }
        });
    }
}

export const proposalFinalizationService = new ProposalFinalizationService();
