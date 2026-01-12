
import { PrismaClient } from "@prisma/client";
import { notificationService } from "./notification.service";

const prisma = new PrismaClient();

export const disputeService = {
    raiseDispute: async (buyerId: string, escrowId: string, reason: string) => {
        // 1. Fetch Escrow
        const escrow = await prisma.escrow.findUnique({
            where: { id: escrowId },
            include: { auction: true }
        });

        if (!escrow) {
            throw { statusCode: 404, message: "Escrow not found" };
        }

        // 2. Validate Status
        if (escrow.status !== "HOLDING") {
            throw { statusCode: 400, message: `Cannot dispute escrow in ${escrow.status} state` };
        }

        // 3. Validate Buyer
        if (escrow.buyerId !== buyerId) {
            throw { statusCode: 403, message: "Only the buyer can raise a dispute" };
        }

        // 4. Check if Dispute exists
        const existingDispute = await prisma.dispute.findUnique({
            where: { escrowId }
        });

        if (existingDispute) {
            throw { statusCode: 400, message: "Dispute already exists for this escrow" };
        }

        // 5. Create Dispute
        const dispute = await prisma.dispute.create({
            data: {
                escrowId,
                buyerId,
                reason,
                status: "OPEN"
            }
        });

        return dispute;
    },

    listDisputes: async () => {
        return await prisma.dispute.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                escrow: { include: { auction: { include: { asset: true } } } },
                buyer: { select: { email: true } }
            }
        });
    },

    resolveDispute: async (adminId: string, disputeId: string, resolution: "REFUND" | "RELEASE") => {
        await prisma.$transaction(async (tx) => {
            // 1. Fetch Dispute & Escrow
            const dispute = await tx.dispute.findUnique({
                where: { id: disputeId },
                include: { escrow: true }
            });

            if (!dispute) throw { statusCode: 404, message: "Dispute not found" };
            if (dispute.status !== "OPEN") throw { statusCode: 400, message: "Dispute already resolved" };
            if (dispute.escrow.status !== "HOLDING") throw { statusCode: 400, message: "Escrow not holding funds" };

            // 2. Execute Resolution
            const escrowAmount = dispute.escrow.amount;

            if (resolution === "REFUND") {
                // Refund Buyer
                await tx.wallet.update({
                    where: { userId: dispute.escrow.buyerId },
                    data: { balance: { increment: escrowAmount } }
                });
                await tx.escrow.update({
                    where: { id: dispute.escrowId },
                    data: { status: "REFUNDED" }
                });
            } else if (resolution === "RELEASE") {
                // Release to Seller
                await tx.wallet.update({
                    where: { userId: dispute.escrow.sellerId },
                    data: { balance: { increment: escrowAmount } }
                });
                await tx.escrow.update({
                    where: { id: dispute.escrowId },
                    data: { status: "RELEASED" }
                });
            } else {
                throw { statusCode: 400, message: "Invalid resolution" };
            }

            // 3. Mark Dispute Resolved
            await tx.dispute.update({
                where: { id: disputeId },
                data: { status: "RESOLVED", resolvedAt: new Date() }
            });

            // 4. Audit Log
            await tx.auditLog.create({
                data: {
                    actorId: adminId,
                    action: `DISPUTE_RESOLVED_${resolution}`,
                    metadata: {
                        disputeId,
                        escrowId: dispute.escrowId,
                        amount: escrowAmount.toString()
                    }
                }
            });
        });

        // 5. Fetch Final State & Notify
        const finalDispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                escrow: {
                    include: {
                        auction: { include: { asset: true } },
                        buyer: true,
                        seller: true
                    }
                }
            }
        });

        if (finalDispute) {
            const assetTitle = finalDispute.escrow.auction.asset.title;
            const message = `Dispute for ${assetTitle} was resolved: ${resolution}`;

            // Notify Buyer
            await notificationService.create({
                userId: finalDispute.escrow.buyerId,
                type: "DISPUTE_RESOLVED",
                message,
                metadata: { disputeId, resolution }
            }).catch(e => console.error(e));

            // Notify Seller
            await notificationService.create({
                userId: finalDispute.escrow.sellerId,
                type: "DISPUTE_RESOLVED",
                message,
                metadata: { disputeId, resolution }
            }).catch(e => console.error(e));

            return finalDispute;
        }

        throw { statusCode: 500, message: "Failed to retrieve dispute details" };
    }
};
