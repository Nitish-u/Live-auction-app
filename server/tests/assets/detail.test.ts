import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";
import jwt from "jsonwebtoken";
import { describe, it, beforeAll, afterAll, expect } from "vitest";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("Asset Detail & Related Endpoints", () => {
    let sellerId: string;
    let sellerToken: string;
    let assetId: string;
    let asset2Id: string;

    beforeAll(async () => {
        // Create seller
        const seller = await prisma.user.create({
            data: {
                email: `seller-detail-${Date.now()}@test.com`,
                password: "password123",
                displayName: "Seller Detail",
                role: "USER",
            },
        });
        sellerId = seller.id;
        sellerToken = jwt.sign({ id: seller.id, email: seller.email, role: seller.role }, JWT_SECRET);

        // Create main asset (Approved)
        const asset = await prisma.asset.create({
            data: {
                title: "Test Asset Detail",
                description: "Description",
                images: ["image1.jpg"],
                metadata: { condition: "New" },
                ownerId: sellerId,
                status: "APPROVED",
            },
        });
        assetId = asset.id;

        // Create another asset for "related items"
        const asset2 = await prisma.asset.create({
            data: {
                title: "Related Asset",
                description: "Related Desc",
                images: ["image2.jpg"],
                metadata: { condition: "Used" },
                ownerId: sellerId,
                status: "APPROVED",
            },
        });
        asset2Id = asset2.id;
    });

    afterAll(async () => {
        await prisma.auction.deleteMany({ where: { assetId: { in: [assetId, asset2Id] } } });
        await prisma.asset.deleteMany({ where: { id: { in: [assetId, asset2Id] } } });
        await prisma.user.delete({ where: { id: sellerId } });
        await prisma.$disconnect();
    });

    describe("GET /api/v1/assets/:id", () => {
        it("should fetch asset by ID with all details", async () => {
            const response = await request(app).get(`/api/v1/assets/${assetId}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(assetId);
            expect(response.body.title).toBeDefined();
            expect(response.body.images).toBeDefined();
            expect(response.body.owner).toBeDefined();
            expect(response.body.owner.id).toBe(sellerId);
        });

        it("should return 404 for non-existent asset", async () => {
            const response = await request(app).get("/api/v1/assets/non-existent-id-123");

            expect(response.status).toBe(404);
        });
    });

    describe("GET /api/v1/users/:id/assets", () => {
        it("should fetch related assets from seller", async () => {
            const response = await request(app).get(`/api/v1/users/${sellerId}/assets`);

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();

            const assets = response.body.items;
            // In getSellerAssets -> filters by sellerId=...
            // Should include BOTH assets since both are APPROVED and owned by seller steps.
            const foundAsset1 = assets.find((a: any) => a.id === assetId);
            const foundAsset2 = assets.find((a: any) => a.id === asset2Id);
            expect(foundAsset1).toBeDefined();
            expect(foundAsset2).toBeDefined();
        });
    });

    describe("GET /api/v1/auctions?assetId=:id", () => {
        it("should return empty array if no auction exists", async () => {
            const response = await request(app).get(`/api/v1/auctions`).query({ assetId });
            expect(response.status).toBe(200);
            // It returns { data: [], ... }
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0);
        });

        it("should return auction if exists", async () => {
            // Create auction for asset
            // MUST be SCHEDULED or LIVE to be seen by default query if no status filter provided
            // But WAIT. If assetId is provided, do we still limit status? 
            // auction.service.ts: 
            // if (status) where.status = status; else where.status = { in: ["SCHEDULED", "LIVE"] };
            // So yes, only SCHEDULED or LIVE are returned by default.

            const startTime = new Date(Date.now() + 600000); // 10 mins later
            const endTime = new Date(Date.now() + 3600000); // 1 hour later

            await prisma.auction.create({
                data: {
                    assetId: assetId,
                    sellerId: sellerId,
                    startTime: startTime,
                    endTime: endTime,
                    status: "SCHEDULED"
                }
            });

            const response = await request(app).get(`/api/v1/auctions`).query({ assetId });
            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].asset.title).toBeDefined();
        });
    });
});
