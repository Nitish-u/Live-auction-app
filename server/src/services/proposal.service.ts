import prisma from "../config/prisma";
import { ProposalStatus } from "@prisma/client";

export const proposalService = {
    // 1. Create Proposal
    createProposal: async (buyerId: string, assetId: string, proposedAmount: number) => {
        // Validation
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
            include: { owner: true }
        });

        if (!asset) {
            throw { statusCode: 404, message: "Asset not found" };
        }

        if (asset.status !== "APPROVED") {
            throw { statusCode: 400, message: "Asset is not approved for proposals" };
        }

        if (asset.ownerId === buyerId) {
            throw { statusCode: 400, message: "Cannot propose on your own asset" };
        }

        if (proposedAmount <= 0) {
            throw { statusCode: 400, message: "Amount must be greater than 0" };
        }

        // Check for existing pending proposal
        const existingProposal = await prisma.bidProposal.findFirst({
            where: {
                assetId,
                buyerId,
                status: "PENDING"
            }
        });

        if (existingProposal) {
            throw { statusCode: 400, message: "You already have a pending proposal for this asset" };
        }

        // Create proposal
        return await prisma.bidProposal.create({
            data: {
                assetId,
                buyerId,
                sellerId: asset.ownerId,
                proposedAmount,
                status: "PENDING"
            }
        });
    },

    // 2. Get Proposals (Buyer - Sent)
    getBuyerProposals: async (buyerId: string) => {
        return await prisma.bidProposal.findMany({
            where: { buyerId },
            include: {
                asset: {
                    select: {
                        id: true,
                        title: true,
                        images: true
                    }
                },
                seller: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    },

    // 3. Get Proposals (Seller - Received)
    getSellerProposals: async (sellerId: string, assetId?: string) => {
        const where: any = { sellerId };
        if (assetId) {
            where.assetId = assetId;
        }

        return await prisma.bidProposal.findMany({
            where,
            include: {
                asset: {
                    select: {
                        id: true,
                        title: true,
                        images: true
                    }
                },
                buyer: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    },

    // 4. Accept Proposal
    acceptProposal: async (userId: string, proposalId: string) => {
        const proposal = await prisma.bidProposal.findUnique({
            where: { id: proposalId }
        });

        if (!proposal) {
            throw { statusCode: 404, message: "Proposal not found" };
        }

        if (proposal.sellerId !== userId) {
            throw { statusCode: 403, message: "Not authorized" };
        }

        if (proposal.status !== "PENDING") {
            throw { statusCode: 400, message: "Proposal is not pending" };
        }

        return await prisma.bidProposal.update({
            where: { id: proposalId },
            data: { status: "ACCEPTED" }
        });
    },

    // 5. Reject Proposal
    rejectProposal: async (userId: string, proposalId: string) => {
        const proposal = await prisma.bidProposal.findUnique({
            where: { id: proposalId }
        });

        if (!proposal) {
            throw { statusCode: 404, message: "Proposal not found" };
        }

        if (proposal.sellerId !== userId) {
            throw { statusCode: 403, message: "Not authorized" };
        }

        return await prisma.bidProposal.update({
            where: { id: proposalId },
            data: { status: "REJECTED" }
        });
    },

    // 6. Counter Proposal
    counterProposal: async (userId: string, proposalId: string, newAmount: number) => {
        const originalProposal = await prisma.bidProposal.findUnique({
            where: { id: proposalId }
        });

        if (!originalProposal) {
            throw { statusCode: 404, message: "Proposal not found" };
        }

        if (originalProposal.sellerId !== userId) {
            throw { statusCode: 403, message: "Not authorized" };
        }

        if (originalProposal.status !== "PENDING") {
            throw { statusCode: 400, message: "Proposal is not pending" };
        }

        if (newAmount <= 0) {
            throw { statusCode: 400, message: "Amount must be greater than 0" };
        }

        // Transaction to update old and create new
        return await prisma.$transaction(async (tx) => {
            // 1. Update original
            await tx.bidProposal.update({
                where: { id: proposalId },
                data: { status: "COUNTERED" }
            });

            // 2. Create new proposal
            // Seller becomes "buyer" (sender of proposal), Buyer becomes "seller" (recipient)
            return await tx.bidProposal.create({
                data: {
                    assetId: originalProposal.assetId,
                    buyerId: userId, // Current user (original seller) is now the proposer
                    sellerId: originalProposal.buyerId, // Original buyer is now the recipient
                    proposedAmount: newAmount,
                    status: "PENDING",
                    parentProposalId: proposalId
                }
            });
        });
    }
};
