
import prisma from "../config/prisma";
import { getIO } from "../socket/socketServer";

export const messageService = {
    getMessages: async (auctionId: string, userId: string) => {
        // 1. Access Control: Must be participant
        const isParticipant = await checkParticipant(auctionId, userId);
        if (!isParticipant) {
            throw { statusCode: 403, message: "Access denied: You are not a participant in this auction" };
        }

        return await prisma.message.findMany({
            where: { auctionId },
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, email: true } } }
        });
    },

    sendMessage: async (auctionId: string, userId: string, content: string) => {
        // 1. Validate Content
        if (!content || content.trim().length === 0) throw { statusCode: 400, message: "Message content cannot be empty" };
        if (content.length > 1000) throw { statusCode: 400, message: "Message too long (max 1000 chars)" };

        // 2. Fetch Auction for Status Check
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: { bids: { orderBy: { amount: "desc" }, take: 1 } } // Need winner for ENDED rule
        });

        if (!auction) throw { statusCode: 404, message: "Auction not found" };

        // 3. Access Control (Status + Role)
        const isSeller = auction.sellerId === userId;
        const isWinner = auction.bids[0]?.bidderId === userId;
        const hasBid = await prisma.bid.findFirst({ where: { auctionId, bidderId: userId } });

        // Rule: LIVE -> Seller or Any Bidder
        if (auction.status === "LIVE") {
            if (!isSeller && !hasBid) {
                throw { statusCode: 403, message: "Access denied: Only participants can message" };
            }
        }
        // Rule: ENDED -> Seller or Winner ONLY
        else if (auction.status === "ENDED") {
            if (!isSeller && !isWinner) {
                throw { statusCode: 403, message: "Access denied: Only winner and seller can message after auction ends" };
            }
        }
        // Rule: Other statuses (SCHEDULED, CANCELLED) -> No messaging
        else {
            throw { statusCode: 403, message: `Messaging not allowed in ${auction.status} status` };
        }

        // 4. Create Message
        const message = await prisma.message.create({
            data: {
                auctionId,
                senderId: userId,
                content
            },
            include: { sender: { select: { id: true, email: true } } }
        });

        // 5. Emit Socket Event
        try {
            const io = getIO();
            io.to(`auction:${auctionId}`).emit("message_sent", {
                id: message.id,
                auctionId,
                sender: message.sender,
                content,
                createdAt: message.createdAt.toISOString()
            });
        } catch (error) {
            console.error("Socket emit failed:", error);
        }

        return message;
    }
};

// Helper: Check if user is seller or has bid
async function checkParticipant(auctionId: string, userId: string): Promise<boolean> {
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) return false;
    if (auction.sellerId === userId) return true;

    const bid = await prisma.bid.findFirst({ where: { auctionId, bidderId: userId } });
    return !!bid;
}
