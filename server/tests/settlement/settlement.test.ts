
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { token } from "../../src/utils/jwt";
import { expect, describe, it, beforeAll, afterAll } from "vitest";

const prisma = new PrismaClient();

describe("FEATURE 9: Auction Settlement", () => {
    let sellerId: string;
    let buyerId: string;
    let adminId: string;
    let adminToken: string;
    let auctionId: string;
    let assetId: string;

    const sellerEmail = "seller-settle@example.com";
    const buyerEmail = "buyer-settle@example.com";
    const adminEmail = "admin-settle@example.com";

    beforeAll(async () => {
        await prisma.escrow.deleteMany();
        await prisma.bid.deleteMany();
        await prisma.auction.deleteMany();
        await prisma.asset.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();

        // 1. Create Users
        const seller = await prisma.user.create({
            data: { email: sellerEmail, password: "hash", role: "USER", wallet: { create: { balance: 0, locked: 0 } } }
        });
        sellerId = seller.id;

        const buyer = await prisma.user.create({
            data: { email: buyerEmail, password: "hash", role: "USER", wallet: { create: { balance: 2000, locked: 0 } } }
        });
        buyerId = buyer.id;

        const admin = await prisma.user.create({
            data: { email: adminEmail, password: "hash", role: "ADMIN", wallet: { create: {} } }
        });
        adminId = admin.id;
        adminToken = token.sign({ sub: admin.id, role: "ADMIN" });

        // 2. Create Asset
        const asset = await prisma.asset.create({
            data: {
                title: "Settlement Item", description: "Desc", images: [], metadata: {},
                status: "APPROVED", ownerId: sellerId
            }
        });
        assetId = asset.id;

        // 3. Create Auction (ENDED for happy path)
        const auction = await prisma.auction.create({
            data: {
                assetId, sellerId, status: "ENDED",
                startTime: new Date(Date.now() - 10000),
                endTime: new Date(Date.now() - 1000)
            }
        });
        auctionId = auction.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("should fail if auction is not ENDED", async () => {
        // Create a LIVE auction
        const liveAsset = await prisma.asset.create({
            data: { title: "Live Item", description: "Desc", images: [], metadata: {}, status: "APPROVED", ownerId: sellerId }
        });
        const liveAuction = await prisma.auction.create({
            data: {
                assetId: liveAsset.id, sellerId, status: "LIVE",
                startTime: new Date(), endTime: new Date(Date.now() + 10000)
            }
        });

        const res = await request(app)
            .post(`/api/v1/auctions/${liveAuction.id}/settle`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error.message).toMatch(/must be ENDED/);
    });

    it("should return NO_BIDS if no bids exist", async () => {
        const res = await request(app)
            .post(`/api/v1/auctions/${auctionId}/settle`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("NO_BIDS");
    });

    it("should fail with 500 if invariant violated (Locked < Bid)", async () => {
        // 1. Reset Auction to ENDED (it is already)
        // 2. Place a Bid directly in DB (simulating previous state)
        // 3. User Wallet Locked = 0 (Violation!)

        await prisma.bid.create({
            data: { amount: 1000, auctionId, bidderId: buyerId }
        });

        // Ensure wallet locked is 0
        await prisma.wallet.update({
            where: { userId: buyerId },
            data: { locked: 0 }
        });

        const res = await request(app)
            .post(`/api/v1/auctions/${auctionId}/settle`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500); // Strict Invariant Check
        expect(res.body.error.message).toMatch(/Invariant Violation/);
    });

    it("should successfully settle auction and move funds to escrow", async () => {
        // 1. Fix Wallet State (Manually set locked = 1000)
        await prisma.wallet.update({
            where: { userId: buyerId },
            data: { locked: 1000, balance: 2000 } // Balance stays same (total)
        });

        // 2. Call Settle
        const res = await request(app)
            .post(`/api/v1/auctions/${auctionId}/settle`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("HOLDING");
        expect(res.body.amount).toBe("1000");

        // 3. Verify DB State
        // Wallet should be unlocked (locked - 1000 = 0)
        const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
        expect(Number(wallet?.locked)).toBe(0);

        // Escrow should exist
        const escrow = await prisma.escrow.findUnique({ where: { auctionId } });
        expect(escrow).toBeTruthy();
        expect(escrow?.buyerId).toBe(buyerId);
        expect(Number(escrow?.amount)).toBe(1000);
    });

    it("should fail if already settled (Double Settlement)", async () => {
        const res = await request(app)
            .post(`/api/v1/auctions/${auctionId}/settle`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(409); // Conflict
    });
});
