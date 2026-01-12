import prisma from '../config/prisma';
import { AssetStatus, AuctionStatus, EscrowStatus, DisputeStatus } from '@prisma/client';

export const getSellerStats = async (userId: string) => {
    const [
        totalAssets,
        approvedAssets,
        pendingAssets,
        scheduledAuctions,
        liveAuctions,
        endedAuctions,
        releasedEscrows,
        holdingEscrows,
    ] = await Promise.all([
        prisma.asset.count({ where: { ownerId: userId } }),
        prisma.asset.count({ where: { ownerId: userId, status: AssetStatus.APPROVED } }),
        prisma.asset.count({ where: { ownerId: userId, status: AssetStatus.PENDING_REVIEW } }),
        prisma.auction.count({ where: { sellerId: userId, status: AuctionStatus.SCHEDULED } }),
        prisma.auction.count({ where: { sellerId: userId, status: AuctionStatus.LIVE } }),
        prisma.auction.count({ where: { sellerId: userId, status: AuctionStatus.ENDED } }),
        prisma.escrow.aggregate({
            _sum: { amount: true },
            where: { sellerId: userId, status: EscrowStatus.RELEASED },
        }),
        prisma.escrow.aggregate({
            _sum: { amount: true },
            where: { sellerId: userId, status: EscrowStatus.HOLDING },
        }),
    ]);

    return {
        assets: {
            total: totalAssets,
            approved: approvedAssets,
            pending: pendingAssets,
        },
        auctions: {
            scheduled: scheduledAuctions,
            live: liveAuctions,
            ended: endedAuctions,
        },
        earnings: {
            totalReleased: releasedEscrows._sum.amount?.toString() || '0.00',
            inEscrow: holdingEscrows._sum.amount?.toString() || '0.00',
        },
    };
};

export const getBidderStats = async (userId: string) => {
    // Active Bids: Count of ongoing bids on LIVE auctions
    // Source: COUNT(Bid WHERE bidderId = userId AND Auction.status = LIVE)
    const activeBidsCount = await prisma.bid.count({
        where: {
            bidderId: userId,
            auction: {
                status: AuctionStatus.LIVE,
            },
        },
    });

    // Won Auctions: Count of successfully won auctions
    // Source: COUNT(Auction WHERE Winner = userId AND status = ENDED)
    // Note: Our Auction model doesn't have a direct 'winnerId' field usually, we check the highest bid.
    // However, for efficiency, if we rely on the 'bids' logic logic:
    // We fetch ENDED auctions where user has a bid, and check if they are the winner.
    // Ideally, we'd have a 'winnerId' on Auction, but let's stick to the bid check logic if schema lacks it.
    // Spec says: COUNT(Auction WHERE Winner = userId AND status = ENDED)

    // Fetch all ENDED auctions where user placed a bid
    const endedParticipatedAuctions = await prisma.auction.findMany({
        where: {
            status: AuctionStatus.ENDED,
            bids: { some: { bidderId: userId } },
        },
        include: {
            bids: {
                orderBy: { amount: 'desc' },
                take: 1,
            },
        },
    });

    let wonCount = 0;
    // let lostCount = 0; // "Lost" not explicitly asked for in stats cards, but nice to have.

    for (const auction of endedParticipatedAuctions) {
        if (auction.bids.length > 0 && auction.bids[0]?.bidderId === userId) {
            wonCount++;
        } else {
            // lostCount++;
        }
    }

    // Wallet
    const wallet = await prisma.wallet.findUnique({
        where: { userId },
    });

    return {
        bids: {
            active: activeBidsCount,
            won: wonCount,
            // lost: lostCount, 
        },
        wallet: {
            balance: wallet?.balance.toString() || '0.00',
            locked: wallet?.locked.toString() || '0.00',
        },
    };
};

export const getAdminStats = async () => {
    const [
        pendingAssets,
        liveAuctions,
        holdingEscrows,
        openDisputes
    ] = await Promise.all([
        prisma.asset.count({ where: { status: AssetStatus.PENDING_REVIEW } }),
        prisma.auction.count({ where: { status: AuctionStatus.LIVE } }),
        prisma.escrow.count({ where: { status: EscrowStatus.HOLDING } }),
        prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
    ]);

    return {
        assetsReview: {
            pending: pendingAssets,
        },
        disputes: {
            open: openDisputes,
        },
        auctions: {
            live: liveAuctions,
        },
        escrows: {
            holding: holdingEscrows,
        },
    };
};
