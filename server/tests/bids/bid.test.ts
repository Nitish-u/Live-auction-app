import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("FEATURE 8: Bidding Logic", () => {
    // Users
    const sellerEmail = `seller-bid-${Date.now()}@example.com`;
    const bidder1Email = `bidder1-${Date.now()}@example.com`;
    const bidder2Email = `bidder2-${Date.now()}@example.com`;
    const password = "password123";

    let sellerToken = "";
    let bidder1Token = "";
    let bidder2Token = "";

    // IDs
    let auctionId = "";
    let b1Id = "";
    let b2Id = "";

    beforeAll(async () => {
        // 1. Create Users
        const sRes = await request(app).post("/api/v1/auth/register").send({ email: sellerEmail, password });
        sellerToken = sRes.body.token;
        // Fund Seller (not needed for bidding, but good for asset creation)

        const b1Res = await request(app).post("/api/v1/auth/register").send({ email: bidder1Email, password });
        bidder1Token = b1Res.body.token;
        b1Id = b1Res.body.user.id;

        const b2Res = await request(app).post("/api/v1/auth/register").send({ email: bidder2Email, password });
        bidder2Token = b2Res.body.token;
        b2Id = b2Res.body.user.id;

        // 2. Fund Bidders
        await prisma.wallet.update({ where: { userId: b1Id }, data: { balance: 2000 } });
        await prisma.wallet.update({ where: { userId: b2Id }, data: { balance: 3000 } });

        // 3. Create & Approve Asset
        const aRes = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ title: "Bidding Item", description: "Valuable", images: ["http://img.com"] });

        const assetId = aRes.body.id;
        await prisma.asset.update({ where: { id: assetId }, data: { status: "APPROVED" } });

        // 4. Create LIVE Auction
        const now = Date.now();
        const start = new Date(now + 600000); // +10m (Scheduled)
        const end = new Date(now + 3600000);

        // Wait, we need it LIVE for bidding.
        // Auction creation enforces start > now + 5m.
        // So we create SCHEDULED, then manually update DB to LIVE (simulate time pass).
        const aucRes = await request(app)
            .post("/api/v1/auctions")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                assetId,
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });

        auctionId = aucRes.body.id;

        // Force LIVE
        await prisma.auction.update({
            where: { id: auctionId },
            data: { status: "LIVE" }
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: { in: [sellerEmail, bidder1Email, bidder2Email] } } });
        await prisma.$disconnect();
    });

    describe("Placing Bids", () => {
        it("should place first bid successfully", async () => {
            const response = await request(app)
                .post("/api/v1/bids")
                .set("Authorization", `Bearer ${bidder1Token}`)
                .send({
                    auctionId,
                    amount: 500
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe("BID_PLACED");
            expect(reqToNumber(response.body.currentHighestBid)).toBe(500);

            // Verify Wallet Lock
            const w = await prisma.wallet.findFirst({ where: { user: { email: bidder1Email } } });
            expect(Number(w?.locked)).toBe(500);
            expect(Number(w?.balance)).toBe(2000); // Balance stays as Total
        });

        it("should fail if bid is lower than current highest", async () => {
            const response = await request(app)
                .post("/api/v1/bids")
                .set("Authorization", `Bearer ${bidder2Token}`)
                .send({
                    auctionId,
                    amount: 400
                });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain("must be higher");
        });

        it("should outbid successfully and handle locks", async () => {
            const wBefore = await prisma.wallet.findUnique({ where: { userId: b1Id } });
            console.log(`[TEST DEBUG] Bidder 1 Wallet Before Outbid: Locked=${wBefore?.locked}`);

            // Bidder 2 bids 1000
            const response = await request(app)
                .post("/api/v1/bids")
                .set("Authorization", `Bearer ${bidder2Token}`)
                .send({
                    auctionId,
                    amount: 1000
                });

            expect(response.status).toBe(201);

            // Verify Bidder 2 Locked
            const w2 = await prisma.wallet.findFirst({ where: { user: { email: bidder2Email } } });
            expect(Number(w2?.locked)).toBe(1000);

            // Verify Bidder 1 Unlocked
            const w1 = await prisma.wallet.findFirst({ where: { user: { email: bidder1Email } } });
            expect(Number(w1?.locked)).toBe(0);
        });

        it("should fail if insufficient funds", async () => {
            // Bidder 1 has 2000 total. Try to bid 2500.
            const response = await request(app)
                .post("/api/v1/bids")
                .set("Authorization", `Bearer ${bidder1Token}`)
                .send({
                    auctionId,
                    amount: 2500
                });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain("Insufficient funds");
        });

        it("should list bids publicly", async () => {
            const response = await request(app).get(`/api/v1/auctions/${auctionId}/bids`);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2); // 500 and 1000
            expect(reqToNumber(response.body[0].amount)).toBe(1000); // Descending
        });
    });
});

function reqToNumber(val: any) {
    return Number(val);
}
