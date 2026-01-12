import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import { UserRole, AssetStatus, AuctionStatus, EscrowStatus, DisputeStatus } from '@prisma/client';
import { token as jwtToken } from '../../src/utils/jwt';

// Helper to create user and token
const createTestUser = async (role: UserRole = 'USER') => {
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: 'password123',
            role,
            displayName: `Test User ${role}`,
        },
    });
    const token = jwtToken.sign({ sub: user.id, role: user.role });
    return { user, token };
};

describe('Dashboard Routes', () => {
    let seller: any;
    let sellerToken: string;
    let bidder: any;
    let bidderToken: string;
    let admin: any;
    let adminToken: string;

    beforeAll(async () => {
        // Create users
        const sellerData = await createTestUser('USER');
        seller = sellerData.user;
        sellerToken = sellerData.token;

        const bidderData = await createTestUser('USER');
        bidder = bidderData.user;
        bidderToken = bidderData.token;

        const adminData = await createTestUser('ADMIN');
        admin = adminData.user;
        adminToken = adminData.token;

        // Seed Data for Seller
        // 1 Approved Asset
        await prisma.asset.create({
            data: {
                title: 'Seller Asset 1',
                description: 'Desc',
                images: [],
                metadata: {},
                status: AssetStatus.APPROVED,
                ownerId: seller.id,
            }
        });

        // 1 Live Auction
        const assetForAuction = await prisma.asset.create({
            data: {
                title: 'Seller Asset 2',
                description: 'Desc',
                images: [],
                metadata: {},
                status: AssetStatus.APPROVED,
                ownerId: seller.id,
            }
        });
        const liveAuction = await prisma.auction.create({
            data: {
                startTime: new Date(),
                endTime: new Date(Date.now() + 100000),
                status: AuctionStatus.LIVE,
                assetId: assetForAuction.id,
                sellerId: seller.id,
            }
        });

        // Seed Data for Bidder
        // Bidder bids on the live auction
        await prisma.bid.create({
            data: {
                amount: 100,
                auctionId: liveAuction.id,
                bidderId: bidder.id,
            }
        });

        // Seed for Admin
        // 1 Dispute
        // Need an ended auction with escrow
        const assetForEscrow = await prisma.asset.create({
            data: {
                title: 'Dispute Asset',
                description: 'Desc',
                images: [],
                metadata: {},
                status: AssetStatus.APPROVED,
                ownerId: seller.id,
            }
        });
        const endedAuction = await prisma.auction.create({
            data: {
                startTime: new Date(Date.now() - 200000),
                endTime: new Date(Date.now() - 100000),
                status: AuctionStatus.ENDED,
                assetId: assetForEscrow.id,
                sellerId: seller.id,
            }
        });
        const escrow = await prisma.escrow.create({
            data: {
                auctionId: endedAuction.id,
                buyerId: bidder.id,
                sellerId: seller.id,
                amount: 500,
                status: EscrowStatus.HOLDING,
            }
        });
        await prisma.dispute.create({
            data: {
                escrowId: escrow.id,
                buyerId: bidder.id,
                reason: 'Not good',
                status: DisputeStatus.OPEN,
            }
        });
    });

    afterAll(async () => {
        // Cleanup if needed, or rely on test DB reset
        await prisma.bid.deleteMany();
        await prisma.dispute.deleteMany();
        await prisma.escrow.deleteMany();
        await prisma.auction.deleteMany();
        await prisma.asset.deleteMany();
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/dashboard/seller', () => {
        it('should return seller stats', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/seller')
                .set('Authorization', `Bearer ${sellerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.assets).toBeDefined();
            // We created 3 assets for seller (1 pure, 1 live auction, 1 dispute/ended)
            expect(res.body.assets.total).toBeGreaterThanOrEqual(3);
            expect(res.body.auctions.live).toBeGreaterThanOrEqual(1);
        });

        it('should require authentication', async () => {
            const res = await request(app).get('/api/v1/dashboard/seller');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/v1/dashboard/bidder', () => {
        it('should return bidder stats', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/bidder')
                .set('Authorization', `Bearer ${bidderToken}`);

            expect(res.status).toBe(200);
            expect(res.body.bids).toBeDefined();
            expect(res.body.bids.active).toBeGreaterThanOrEqual(1); // Bidded on live auction
        });
    });

    describe('GET /api/v1/dashboard/admin', () => {
        it('should return admin stats for admin user', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.disputes.open).toBeGreaterThanOrEqual(1);
        });

        it('should forbid non-admin user', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', `Bearer ${sellerToken}`);

            expect(res.status).toBe(403);
        });
    });
});
