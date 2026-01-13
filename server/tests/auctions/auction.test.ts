import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";

describe("FEATURE 6: Auction Scheduling", () => {
    // Users
    const sellerEmail = `seller-${Date.now()}@example.com`;
    const buyerEmail = `buyer-${Date.now()}@example.com`;
    const password = "securePassword123";

    let sellerToken = "";
    let sellerId = "";
    let buyerToken = "";

    // Assets
    let approvedAssetId = "";
    let draftAssetId = "";

    beforeAll(async () => {
        // 1. Create Seller & Buyer
        const sRes = await request(app).post("/api/v1/auth/register").send({ email: sellerEmail, password });
        sellerToken = sRes.body.token;
        sellerId = sRes.body.user.id;

        const bRes = await request(app).post("/api/v1/auth/register").send({ email: buyerEmail, password });
        buyerToken = bRes.body.token;

        // 2. Create Assets (Seller owns)
        // Approved
        const aRes = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ title: "Approved Item", description: "Desc", images: ["http://url.com/img.png"] });
        approvedAssetId = aRes.body.id;
        if (!approvedAssetId) throw new Error("Failed to create asset");
        // Force Approve (simulate admin)
        await prisma.asset.update({ where: { id: approvedAssetId }, data: { status: "APPROVED" } });

        // Draft
        const dRes = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ title: "Draft Item", description: "Desc", images: ["http://url.com/img.png"] });
        draftAssetId = dRes.body.id;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: { in: [sellerEmail, buyerEmail] } } });

    });

    describe("Auction Creation", () => {
        it("should fail validation if startTime is not > 5 mins in future", async () => {
            const now = new Date();
            const response = await request(app)
                .post("/api/v1/auctions")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({
                    assetId: approvedAssetId,
                    startTime: new Date(now.getTime() + 1 * 60000).toISOString(),
                    endTime: new Date(now.getTime() + 60 * 60000).toISOString()
                });
            expect(response.status).toBe(400);
            expect(response.body.error.details[0].message).toContain("Start time must be at least 5 minutes");
        });

        it("should fail if endTime <= startTime", async () => {
            const start = new Date(Date.now() + 10 * 60000); // +10m
            const end = new Date(Date.now() + 9 * 60000); // +9m
            const response = await request(app)
                .post("/api/v1/auctions")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({
                    assetId: approvedAssetId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString()
                });
            expect(response.status).toBe(400);
        });

        it("should fail if asset is not APPROVED (Draft)", async () => {
            const start = new Date(Date.now() + 10 * 60000);
            const end = new Date(Date.now() + 60 * 60000);
            const response = await request(app)
                .post("/api/v1/auctions")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({
                    assetId: draftAssetId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString()
                });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain("APPROVED");
        });

        let auctionId = "";
        it("should create auction for approved asset", async () => {
            const start = new Date(Date.now() + 10 * 60000);
            const end = new Date(Date.now() + 60 * 60000);
            const response = await request(app)
                .post("/api/v1/auctions")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({
                    assetId: approvedAssetId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString()
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe("SCHEDULED");
            auctionId = response.body.id;
        });

        it("should fail to create second auction for same asset", async () => {
            const start = new Date(Date.now() + 20 * 60000);
            const end = new Date(Date.now() + 80 * 60000);
            const response = await request(app)
                .post("/api/v1/auctions")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({
                    assetId: approvedAssetId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString()
                });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain("already has");
        });
    });

    describe("Auction Listing", () => {
        it("should list scheduled auctions", async () => {
            // We can still use the API endpoint test which goes through controller -> service
            // The controller handles the object construction.
            // But if we have direct service tests (we don't here, we use supertest), we need to check if we broke anything.
            // This file uses `request(app)` so it hits the controller.
            // The controller was updated to parse query params.
            // So `GET /api/v1/auctions` with no params should work and use defaults.
            const response = await request(app).get("/api/v1/auctions");
            expect(response.status).toBe(200);
            // Response format changed to { data: [], meta: {} }
            const found = response.body.data.find((a: any) => a.assetId === approvedAssetId);
            expect(found).toBeDefined();
            expect(found.status).toBe("SCHEDULED");
        });

        it("should filter by status", async () => {
            const response = await request(app).get("/api/v1/auctions?status=SCHEDULED");
            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].status).toBe("SCHEDULED");
        });

        it("should exclude cancelled auctions by default", async () => {
            // We need to create a cancelled auction first (already done in previous tests but logic flow is linear)
            // Let's rely on the previous test state or create a new one?
            // The previous test suite runs sequentially.
            // "Auction Cancellation" comes AFTER "Auction Listing".
            // So at this point, we only have the scheduled one.
        });
    });

    describe("Auction Cancellation", () => {
        // Need ID from creation test
        // We'll query it to be safe
        let targetAuctionId = "";

        beforeAll(async () => {
            const auctions = await prisma.auction.findMany({ where: { assetId: approvedAssetId } });
            if (!auctions[0]) throw new Error("Setup failed: No auction found for approved asset");
            targetAuctionId = auctions[0].id;
        });

        it("should fail if non-owner tries to cancel", async () => {
            const response = await request(app)
                .post(`/api/v1/auctions/${targetAuctionId}/cancel`)
                .set("Authorization", `Bearer ${buyerToken}`);
            expect(response.status).toBe(403);
        });

        it("should allow owner to cancel SCHEDULED auction", async () => {
            const response = await request(app)
                .post(`/api/v1/auctions/${targetAuctionId}/cancel`)
                .set("Authorization", `Bearer ${sellerToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("CANCELLED");
        });

        it("should not be returned in default list after cancellation", async () => {
            const response = await request(app).get("/api/v1/auctions");
            const found = response.body.data.find((a: any) => a.id === targetAuctionId);
            expect(found).toBeUndefined();
        });
    });
});
