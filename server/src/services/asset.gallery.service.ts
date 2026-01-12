import prisma from '../config/prisma';
import { AssetStatus, AuctionStatus } from '@prisma/client';

interface GetPublicQueryParams {
    page: number;
    limit: number;
    sellerId?: string;
    hasAuction?: boolean;
}

export const fetchPublicAssets = async (params: GetPublicQueryParams) => {
    const { page, limit, sellerId, hasAuction } = params;
    const skip = (page - 1) * limit;

    const whereClause: any = {
        status: AssetStatus.APPROVED,
    };

    if (sellerId) {
        whereClause.ownerId = sellerId;
    }

    if (hasAuction !== undefined) {
        // If hasAuction is true, we want assets that have AT LEAST ONE auction that is NOT cancelled
        // If hasAuction is false, we want assets that have NO auctions OR only cancelled auctions (simplified: no auctions for now to be safe, or check detailed logic)
        // The prompt says: "Exclude cancelled auctions".
        // Let's refine:
        // "Join with User (owner)"
        // "Left join with Auction (if exists)"
        // "Exclude cancelled auctions" -> meaning if we are showing auction info, it shouldn't be a cancelled one.

        // For filtering:
        if (hasAuction) {
            whereClause.auction = {
                status: { not: AuctionStatus.CANCELLED }
            };
        } else {
            // hasAuction = false
            // This usually means assets that are just sitting there.
            // However, the prompt requirements for filtering are simple "hasAuction=true|false".
            // Let's stick to the prompt's likely intent: filter by existence of non-cancelled auction.
            whereClause.OR = [
                { auction: null },
                { auction: { status: AuctionStatus.CANCELLED } }
            ];
        }
    }

    const [total, assets] = await Promise.all([
        prisma.asset.count({ where: whereClause }),
        prisma.asset.findMany({
            where: whereClause,
            skip,
            take: limit,
            include: {
                owner: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                auction: {
                    select: {
                        id: true,
                        status: true,
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        }),
    ]);

    const items = assets.map((asset) => {
        let auction = asset.auction;
        // Exclude cancelled auctions from the view (treat as null)
        if (auction && auction.status === AuctionStatus.CANCELLED) {
            auction = null;
        }

        return {
            id: asset.id,
            title: asset.title,
            images: asset.images,
            owner: asset.owner,
            auction: auction,
        };
    });

    return {
        items,
        page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
    };
};
