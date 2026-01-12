
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { token } from "../../src/utils/jwt";
import { expect, describe, it, beforeAll, afterAll } from "vitest";

const prisma = new PrismaClient();

describe("FEATURE 11: Messaging Access Control", () => {
    let sellerId: string;
    let bidderId: string;
    let nonBidderId: string;
    let sellerToken: string;
    let bidderToken: string;
    let nonBidderToken: string;
    let auctionId: string;

    beforeAll(async () => {
        await prisma.message.deleteMany();
        await prisma.bid.deleteMany();
        await prisma.auction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();

        // Users
        const seller = await prisma.user.create({
            data: { email: "msg-seller@example.com", password: "hash", role: "USER" }
        });
        sellerId = seller.id;
        sellerToken = token.sign({ sub: seller.id });

        const bidder = await prisma.user.create({
            data: { email: "msg-bidder@example.com", password: "hash", role: "USER", wallet: { create: { balance: 1000 } } }
        });
        bidderId = bidder.id;
        bidderToken = token.sign({ sub: bidder.id });

        const nonBidder = await prisma.user.create({
            data: { email: "msg-random@example.com", password: "hash", role: "USER" }
        });
        nonBidderId = nonBidder.id;
        nonBidderToken = token.sign({ sub: nonBidder.id });

        // Asset
        const asset = await prisma.asset.create({
            data: { title: "Chat Item", description: "Desc", images: [], metadata: {}, status: "APPROVED", ownerId: sellerId }
        });

        // Auction (LIVE)
        const auction = await prisma.auction.create({
            data: {
                assetId: asset.id, sellerId, status: "LIVE",
                startTime: new Date(), endTime: new Date(Date.now() + 100000)
            }
        });
        auctionId = auction.id;

        // Place Bid (Make 'bidder' a participant)
        await prisma.bid.create({
            data: { auctionId, bidderId, amount: 100 }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe("Access Control", () => {
        it("should allow SELLER to send message", async () => {
            const res = await request(app)
                .post(`/api/v1/auctions/${auctionId}/messages`)
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({ content: "Hello Bidders" });

            expect(res.status).toBe(201);
            expect(res.body.content).toBe("Hello Bidders");
            expect(res.body.senderId).toBe(sellerId);
        });

        it("should allow BIDDER (participant) to send message", async () => {
            const res = await request(app)
                .post(`/api/v1/auctions/${auctionId}/messages`)
                .set("Authorization", `Bearer ${bidderToken}`)
                .send({ content: "Is this authentic?" });

            expect(res.status).toBe(201);
        });

        it("should BLOCK non-participant (no bids)", async () => {
            const res = await request(app)
                .post(`/api/v1/auctions/${auctionId}/messages`)
                .set("Authorization", `Bearer ${nonBidderToken}`)
                .send({ content: "Can I spam?" });

            expect(res.status).toBe(403);
            expect(res.body.error.message).toMatch(/Access denied/);
        });
    });

    describe("Lifecycle Rules", () => {
        it("should BLOCK messaging if Auction is ENDED and user is not winner/seller", async () => {
            // End the auction
            await prisma.auction.update({
                where: { id: auctionId },
                data: { status: "ENDED" }
            });

            // Create another bidder who lost (has bid, but not winner)
            // Wait, logic says: "ENDED -> Seller or Winner"
            // So a loser bidder should be blocked?
            // "Winner or Seller".
            // Let's verify losing bidder blocked.

            const loser = await prisma.user.create({
                data: { email: "msg-loser@ex.com", password: "hash", role: "USER", wallet: { create: {} } }
            });
            const loserToken = token.sign({ sub: loser.id });
            await prisma.bid.create({ data: { auctionId, bidderId: loser.id, amount: 50 } }); // Lower bid

            const res = await request(app)
                .post(`/api/v1/auctions/${auctionId}/messages`)
                .set("Authorization", `Bearer ${loserToken}`)
                .send({ content: "Did I win?" });

            expect(res.status).toBe(403);
        });

        it("should ALLOW Winner in ENDED auction", async () => {
            // BidderId is current winner (100 > 50)
            const res = await request(app)
                .post(`/api/v1/auctions/${auctionId}/messages`)
                .set("Authorization", `Bearer ${bidderToken}`)
                .send({ content: "Payment sent?" });

            expect(res.status).toBe(201);
        });
    });

    describe("Input Validation", () => {
        it("should reject empty content", async () => {
            const res = await request(app)
                .post(`/api/v1/auctions/${auctionId}/messages`)
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({ content: "   " }); // Trim check

            expect(res.status).toBe(400);
        });
    });
});
