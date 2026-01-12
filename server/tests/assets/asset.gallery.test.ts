import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import { AssetStatus, AuctionStatus, UserRole } from '@prisma/client';

describe('Asset Gallery API', () => {
    let seller: any;
    let buyer: any;
    let approvedAsset: any;
    let draftAsset: any;
    let assetWithAuction: any;

    beforeAll(async () => {
        // Clean up
        await prisma.bid.deleteMany();
        await prisma.auction.deleteMany();
        await prisma.asset.deleteMany();
        await prisma.user.deleteMany();

        // Create users
        seller = await prisma.user.create({
            data: {
                email: 'seller@test.com',
                displayName: 'Seller Test',
                role: UserRole.USER,
                password: 'password123',
            },
        });

        buyer = await prisma.user.create({
            data: {
                email: 'buyer@test.com',
                displayName: 'Buyer Test',
                role: UserRole.USER,
                password: 'password123',
            },
        });

        // Create Assets
        approvedAsset = await prisma.asset.create({
            data: {
                title: 'Approved Asset',
                description: 'Test Description',
                images: ['http://example.com/image.jpg'],
                status: AssetStatus.APPROVED,
                ownerId: seller.id,
                metadata: {},
            },
        });

        draftAsset = await prisma.asset.create({
            data: {
                title: 'Draft Asset',
                description: 'Draft Description',
                images: [],
                status: AssetStatus.DRAFT,
                ownerId: seller.id,
                metadata: {},
            },
        });

        assetWithAuction = await prisma.asset.create({
            data: {
                title: 'Auction Asset',
                description: 'Auction Description',
                images: [],
                status: AssetStatus.APPROVED,
                ownerId: seller.id,
                metadata: {},
            },
        });

        await prisma.auction.create({
            data: {
                assetId: assetWithAuction.id,
                sellerId: seller.id,
                startTime: new Date(Date.now() + 100000),
                endTime: new Date(Date.now() + 200000),
                status: AuctionStatus.SCHEDULED,
            },
        });
    });

    afterAll(async () => {
        await prisma.bid.deleteMany();
        await prisma.auction.deleteMany();
        await prisma.asset.deleteMany();
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/assets', () => {
        it('should return only approved assets', async () => {
            const res = await request(app).get('/api/v1/assets');
            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(2); // approvedAsset and assetWithAuction
            const ids = res.body.items.map((i: any) => i.id);
            expect(ids).toContain(approvedAsset.id);
            expect(ids).toContain(assetWithAuction.id);
            expect(ids).not.toContain(draftAsset.id);
        });

        it('should filter by hasAuction=true', async () => {
            const res = await request(app).get('/api/v1/assets?hasAuction=true');
            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].id).toBe(assetWithAuction.id);
            expect(res.body.items[0].auction).not.toBeNull();
        });

        it('should filter by sellerId', async () => {
            const res = await request(app).get(`/api/v1/assets?sellerId=${seller.id}`);
            expect(res.status).toBe(200);
            expect(res.body.items.length).toBeGreaterThanOrEqual(1);
        });

        it('should paginate results', async () => {
            const res = await request(app).get('/api/v1/assets?page=1&limit=1');
            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
        });
    });

    describe('GET /api/v1/users/:id/assets', () => {
        it('should return assets for specific seller', async () => {
            const res = await request(app).get(`/api/v1/users/${seller.id}/assets`);
            expect(res.status).toBe(200);
            expect(res.body.items).toBeDefined();
            // Should contain approved assets for this seller
            const ids = res.body.items.map((i: any) => i.id);
            expect(ids).toContain(approvedAsset.id);
            expect(ids).not.toContain(draftAsset.id);
        });
    });
});
