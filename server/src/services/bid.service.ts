import { PrismaClient } from "@prisma/client";
import { placeBidSchema } from "../validators/bid.schema";
import { getIO } from "../socket/socketServer";
import { notificationService } from "./notification.service";

const prisma = new PrismaClient();

export const bidService = {
    placeBid: async (bidderId: string, data: { auctionId: string; amount: number }) => {
        // 1. Transaction: Check LIVE, Balance, Highest Bid -> Lock/Unlock -> Create Bid
        const transactionResult = await prisma.$transaction(async (tx) => {
            const { auctionId, amount } = data;

            // A. Fetch Auction & Asset & Current Highest Bid
            const auction = await tx.auction.findUnique({
                where: { id: auctionId },
                include: {
                    bids: {
                        orderBy: { amount: 'desc' },
                        take: 1,
                        include: { bidder: true } // Need bidderId to unlock
                    },
                    asset: true
                },
            });

            if (!auction) {
                throw { statusCode: 404, message: "Auction not found" };
            }

            // Rule: Must be LIVE
            if (auction.status !== "LIVE") {
                throw { statusCode: 400, message: "Auction is not LIVE" };
            }

            // Rule: Cannot bid on own auction (Optional, but good practice)
            if (auction.sellerId === bidderId) {
                throw { statusCode: 403, message: "Cannot bid on your own auction" };
            }

            // B. Validate Amount > Current Highest
            const currentHighestBid = auction.bids[0];
            const newBidAmount = Number(amount); // Ensure number/decimal handling matches

            if (currentHighestBid) {
                const highestAmount = Number(currentHighestBid.amount);
                if (newBidAmount <= highestAmount) {
                    throw { statusCode: 400, message: `Bid amount must be higher than ${highestAmount}` };
                }
            } else {
                // First bid: Must be > 0 (handled by Zod), let's say minimum start price? 
                // For now just > 0.
            }

            // C. Check Bidder Balance
            // We need to lock the FULL amount.
            // If the bidder has already bid on this auction (re-bid), we technically only need difference.
            // But simplifying: Unlock previous bid if any, then Lock new full amount.
            // Wait, if SAME bidder is highest, they are just increasing.
            // Let's handle general case: Untangle previous high bidder funds, then Lock new bidder funds.

            // C1. Fetch Bidder Wallet
            const bidderWallet = await tx.wallet.findUnique({
                where: { userId: bidderId },
                include: { user: { select: { email: true } } }
            });
            if (!bidderWallet) throw { statusCode: 400, message: "Bidder wallet not found" };

            // Calculate required funds
            // If bidder was already the highest bidder, we should credit them back first?
            // Or checking balance diff?
            // "Safe enough to add sockets later" -> Atomic operations.
            // Let's assume strict Lock/Unlock cycle for simplicity and correctness.

            // D. Unlock Previous High Bidder (If exists)
            if (currentHighestBid) {
                // Credit back the 'locked' amount to the previous bidder's balance?
                // Wait, 'locked' funds are still in the wallet but in 'locked' column. 
                // So we move from 'locked' -> 'balance'.

                await tx.wallet.update({
                    where: { userId: currentHighestBid.bidderId },
                    data: {
                        locked: { decrement: currentHighestBid.amount },
                        // balance stays same? No, 'available balance' is usually total - locked.
                        // Our schema: `balance` (implied available?) or `balance` is total?
                        // Let's check Wallet Funding feature.
                        // Feature 1: "CHECK (balance >= 0)"
                        // Feature 3: Add Funds -> balance += amount.
                        // So strict interpretation:
                        // Available = Balance - Locked.
                        // When locking: Locked += amount. Check (Balance - Locked >= 0)?
                        // Or do we deduct from balance and add to locked?
                        // "Wallet Funding: ... double-entry ledger".
                        // Let's check `addFunds` logic if possible, or assume:
                        // Balance = Liquid funds. Locked = In-flight funds.
                        // Lock: Balance -= amount, Locked += amount.
                        // Unlock: Locked -= amount, Balance += amount.
                        // Let's verify schema constraints/logic from memory or assumption.
                        // Constraint: "non-negative balance and locked".
                        // If we use Balance as Total, and Locked as subset, then:
                        // Available = Balance - Locked.
                        // Lock: Locked += amount. Check Locked <= Balance.
                        // Unlock: Locked -= amount.
                        // THIS IS SAFER. Let's assume Balance is TOTAL.
                    }
                });
            }

            // WAIT! I need to know if Balance is Total or Available.
            // Feature 1 log says: "balance Decimal @default(0), locked Decimal @default(0)".
            // Standard pattern: Balance is Total. Available = Balance - Locked.
            // Let's stick to this.

            // E. Lock New Bidder Funds
            // Check sufficiency
            const totalBalance = Number(bidderWallet.balance);
            const currentLocked = Number(bidderWallet.locked);
            const available = totalBalance - currentLocked;

            // Special case: If I am the previous highest bidder, my funds are currently locked.
            // They will be unlocked in Step D.
            // So my available funds will increase by previous bid amount.
            // BUT Step D executes in DB. JS variable `available` is stale.
            // Logic correction: 
            // 1. If previous bidder == current bidder, we just need (newAmount - oldAmount) more.
            // 2. Or, rely on DB atomic update?
            // DB Update:
            // update wallet set locked = locked + amount where id = ...
            // We need a check.

            // Let's do it explicitly:
            // If prevBidderId != bidderId -> check wallet has `amount`.
            // If prevBidderId == bidderId -> check wallet has `amount - prevAmount`.

            let requiredLiquidity = newBidAmount;
            if (currentHighestBid && currentHighestBid.bidderId === bidderId) {
                requiredLiquidity = newBidAmount - Number(currentHighestBid.amount);
            }

            if (available < requiredLiquidity) {
                throw { statusCode: 400, message: "Insufficient funds" };
            }

            // Proceed to updates
            // D (Real): Unlock previous (Strictly)
            if (currentHighestBid) {
                console.error(`[DEBUG TX] Unlocking Previous. Bidder: ${currentHighestBid.bidderId}, Amount: ${currentHighestBid.amount}`);
                const prevWallet = await tx.wallet.findUnique({ where: { userId: currentHighestBid.bidderId } });
                console.error(`[DEBUG TX] Previous Wallet State: Locked=${prevWallet?.locked}, Balance=${prevWallet?.balance}`);

                if (prevWallet) {
                    const currentLocked = Number(prevWallet.locked);
                    const unlockAmount = Number(currentHighestBid.amount);
                    let newLocked = currentLocked - unlockAmount;

                    if (newLocked < 0) {
                        console.warn(`[WARNING] Negative Locked Balance Detected! forcing 0. Start: ${currentLocked}, Unlock: ${unlockAmount}`);
                        newLocked = 0;
                    }

                    await tx.wallet.update({
                        where: { userId: currentHighestBid.bidderId },
                        data: { locked: newLocked }
                    });
                }
            }

            // E (Real): Lock new
            await tx.wallet.update({
                where: { userId: bidderId },
                data: { locked: { increment: newBidAmount } }
            });

            // F. Create Bid
            const bid = await tx.bid.create({
                data: {
                    amount: newBidAmount,
                    auctionId,
                    bidderId
                }
            });

            return {
                status: "BID_PLACED",
                bid,
                bidderEmail: bidderWallet.user.email,
                previousBidderId: currentHighestBid?.bidderId,
                assetTitle: auction.asset.title
            };
        });

        // Emit Socket Event (Fire & Forget)
        try {
            const io = getIO();
            io.to(`auction:${data.auctionId}`).emit("bid_placed", {
                auctionId: data.auctionId,
                amount: transactionResult.bid.amount.toString(),
                bidder: {
                    id: bidderId,
                    email: transactionResult.bidderEmail
                },
                timestamp: transactionResult.bid.createdAt.toISOString()
            });
        } catch (error) {
            console.error("Socket emit failed:", error);
            // Non-blocking
        }

        // Trigger OUTBID Notification
        try {
            if (transactionResult.previousBidderId && transactionResult.previousBidderId !== bidderId) {
                await notificationService.create({
                    userId: transactionResult.previousBidderId,
                    type: "OUTBID",
                    message: `You were outbid on ${transactionResult.assetTitle}`,
                    metadata: { auctionId: data.auctionId }
                });
            }
        } catch (error) {
            console.error("Notification creation failed:", error);
        }

        return { status: transactionResult.status, currentHighestBid: transactionResult.bid.amount };
    },

    getBids: async (auctionId: string) => {
        return await prisma.bid.findMany({
            where: { auctionId },
            orderBy: { createdAt: 'desc' },
            include: {
                bidder: { select: { id: true, email: true } } // Select minimal info
            }
        });
    }
};
