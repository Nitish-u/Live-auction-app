
import prisma from "../config/prisma";
import { notificationService } from "./notification.service";

export const settlementService = {
    settleAuction: async (auctionId: string) => {
        // 1. Fetch Auction
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: { asset: true }
        });

        if (!auction) throw { statusCode: 404, message: "Auction not found" };

        // 2. Check Status (Must be ENDED)
        if (auction.status !== "ENDED") {
            throw { statusCode: 400, message: "Auction must be ENDED to settle" };
        }

        // 3. Check if Escrow exists
        const existingEscrow = await prisma.escrow.findUnique({
            where: { auctionId }
        });
        if (existingEscrow) {
            throw { statusCode: 409, message: "Auction already settled (Escrow exists)" };
        }

        // 4. Fetch Highest Bid
        const highestBid = await prisma.bid.findFirst({
            where: { auctionId },
            orderBy: { amount: "desc" }
        });

        if (!highestBid) {
            return { status: "NO_BIDS", message: "No bids found. No escrow created." };
        }

        // 5. Fetch Winner's Wallet
        const winnerWallet = await prisma.wallet.findUnique({
            where: { userId: highestBid.bidderId }
        });
        if (!winnerWallet) throw { statusCode: 404, message: "Winner wallet not found" };

        // 6. Invariant Check (STRICT)
        // If locked < bidAmount, this is a critical system failure.
        const locked = Number(winnerWallet.locked);
        const bidAmount = Number(highestBid.amount);

        if (locked < bidAmount) {
            console.error(`[CRITICAL] Invariant Violation: Wallet locked ${locked} < Bid ${bidAmount}. Auction: ${auctionId}, Bidder: ${highestBid.bidderId}`);
            throw { statusCode: 500, message: "Invariant Violation: Insufficient locked funds for settlement" };
        }

        // 7. Transaction
        const result = await prisma.$transaction(async (tx) => {
            // A. Reduce Locked Funds
            await tx.wallet.update({
                where: { userId: highestBid.bidderId },
                data: { locked: { decrement: highestBid.amount } }
            });

            // B. Create Escrow
            const escrow = await tx.escrow.create({
                data: {
                    auctionId,
                    buyerId: highestBid.bidderId,
                    sellerId: auction.sellerId,
                    amount: highestBid.amount,
                    status: "HOLDING"
                }
            });

            return {
                auctionId,
                escrowId: escrow.id,
                amount: escrow.amount,
                status: escrow.status,
                winnerId: highestBid.bidderId,
                assetTitle: auction.asset.title
            };
        });

        // Trigger AUCTION_WON Notification
        try {
            if (result.winnerId) {
                await notificationService.create({
                    userId: result.winnerId,
                    type: "AUCTION_WON",
                    message: `You won the auction for ${result.assetTitle}`,
                    metadata: { auctionId, escrowId: result.escrowId }
                });
            }
        } catch (error) {
            console.error("Failed to create AUCTION_WON notification:", error);
        }

        return result;
    }
};
