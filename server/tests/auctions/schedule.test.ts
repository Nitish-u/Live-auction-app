import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";

describe("Feature 26: Schedule Auction", () => {
    let authToken: string;
    let approvedAssetId: string;
    let draftAssetId: string;
    let sellerId: string;
    const sellerEmail = `seller-feature26-${Date.now()}@example.com`;
    const password = "password123";

    beforeAll(async () => {
        // 1. Create Seller & Login
        const sRes = await request(app).post("/api/v1/auth/register").send({ email: sellerEmail, password });
        authToken = sRes.body.token;
        sellerId = sRes.body.user.id;

        // 2. Create Approved Asset
        const aRes = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ title: "Approved Asset", description: "Desc", images: ["http://url.com/img.png"] });
        approvedAssetId = aRes.body.id;

        // Force Approve (simulate admin)
        await prisma.asset.update({ where: { id: approvedAssetId }, data: { status: "APPROVED" } });

        // 3. Create Draft Asset
        const dRes = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ title: "Draft Asset", description: "Desc", images: ["http://url.com/img.png"] });
        draftAssetId = dRes.body.id;
    });

    afterAll(async () => {
        await prisma.auction.deleteMany({ where: { sellerId } });
        await prisma.asset.deleteMany({ where: { ownerId: sellerId } });
        await prisma.user.delete({ where: { id: sellerId } });

    });

    it("should schedule auction with valid data", async () => {
        const startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

        const response = await request(app)
            .post("/api/v1/auctions")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                assetId: approvedAssetId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("SCHEDULED");
        expect(response.body.assetId).toBe(approvedAssetId);
    });

    it("should reject if start time is in the past", async () => {
        const startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        const endTime = new Date(Date.now() + 60 * 60 * 1000);

        const response = await request(app)
            .post("/api/v1/auctions")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                assetId: approvedAssetId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

        expect(response.status).toBe(400);
        expect(response.body.error.details[0].message).toContain("Start time must be at least 5 minutes");
    });

    it("should reject if duration exceeds 24 hours", async () => {
        const startTime = new Date(Date.now() + 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 25 * 60 * 60 * 1000); // 25 hours

        const response = await request(app)
            .post("/api/v1/auctions")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                assetId: approvedAssetId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

        expect(response.status).toBe(400);
        expect(response.body.error.details[0].message).toContain("Auction duration cannot exceed 24 hours");
    });

    it("should reject if asset is not approved", async () => {
        const startTime = new Date(Date.now() + 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        const response = await request(app)
            .post("/api/v1/auctions")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                assetId: draftAssetId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("Asset must be APPROVED");
    });
});
