import { PrismaClient, AuctionStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const auctionService = {
    createAuction: async (userId: string, data: { assetId: string; startTime: string; endTime: string }) => {
        // 1. Fetch Asset
        const asset = await prisma.asset.findUnique({
            where: { id: data.assetId },
            include: { auction: true }
        });

        if (!asset) {
            throw { statusCode: 404, message: "Asset not found" };
        }

        // 2. Ownership
        if (asset.ownerId !== userId) {
            throw { statusCode: 403, message: "You do not own this asset" };
        }

        // 3. Status check
        if (asset.status !== "APPROVED") {
            throw { statusCode: 400, message: "Asset must be APPROVED to be auctioned" };
        }

        // 4. One active auction rule
        if (asset.auction && asset.auction.status !== "CANCELLED") {
            throw { statusCode: 400, message: "Asset already has an active or scheduled auction" };
        }

        // 5. Create
        return await prisma.auction.create({
            data: {
                assetId: data.assetId,
                sellerId: userId,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                status: "SCHEDULED"
            }
        });
    },

    listAuctions: async (options: {
        page: number;
        limit: number;
        sortBy: "startTime" | "endTime";
        sortOrder: "asc" | "desc";
        status?: AuctionStatus | undefined;
        assetId?: string | undefined;
    }) => {
        const { page, limit, sortBy, sortOrder, status, assetId } = options;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (assetId) {
            where.assetId = assetId;
        }

        if (status) {
            where.status = status;
        } else {
            // Default public view: No cancelled, and no ended (unless filtered)
            // Requirement: "Exclude ENDED by default"
            where.status = {
                in: ["SCHEDULED", "LIVE"]
            };
        }

        const [total, auctions] = await Promise.all([
            prisma.auction.count({ where }),
            prisma.auction.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
                include: {
                    asset: {
                        select: { title: true, images: true }
                    },
                    seller: {
                        select: { id: true, email: true, displayName: true, avatarUrl: true }
                    }
                }
            })
        ]);

        return {
            data: auctions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    getAuction: async (id: string) => {
        const auction = await prisma.auction.findUnique({
            where: { id },
            include: {
                asset: true,
                seller: { select: { id: true, email: true, displayName: true, avatarUrl: true } },
                bids: {
                    orderBy: { amount: 'desc' },
                    take: 5, // Last 5 bids for history
                    include: { bidder: { select: { email: true, displayName: true, avatarUrl: true } } }
                },
                escrow: true
            }
        });
        if (!auction) throw { statusCode: 404, message: "Auction not found" };
        return auction;
    },

    cancelAuction: async (userId: string, auctionId: string) => {
        const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

        if (!auction) {
            throw { statusCode: 404, message: "Auction not found" };
        }

        if (auction.sellerId !== userId) {
            throw { statusCode: 403, message: "Unauthorized" };
        }

        if (auction.status !== "SCHEDULED") {
            throw { statusCode: 400, message: "Only SCHEDULED auctions can be cancelled" };
        }

        return await prisma.auction.update({
            where: { id: auctionId },
            data: { status: "CANCELLED" }
        });
    }
};
