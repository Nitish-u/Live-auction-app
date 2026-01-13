
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";
import jwt from "jsonwebtoken";
import { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect } from "vitest";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("Admin Asset Review", () => {
    let adminToken: string;
    let userToken: string;
    let pendingAssetId: string;
    let userId: string;
    let adminId: string;

    beforeAll(async () => {
        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: `admin-${Date.now()}@test.com`,
                password: "password123",
                displayName: "Admin User",
                role: "ADMIN",
            },
        });
        adminId = admin.id;
        adminToken = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET);

        // Create regular user
        const user = await prisma.user.create({
            data: {
                email: `user-${Date.now()}@test.com`,
                password: "password123",
                displayName: "Regular User",
                role: "USER",
            },
        });
        userId = user.id;
        userToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    });

    afterAll(async () => {
        if (adminId && userId) {
            await prisma.bid.deleteMany({ where: { bidderId: { in: [adminId, userId] } } });
            await prisma.dispute.deleteMany({ where: { buyerId: { in: [adminId, userId] } } });
            await prisma.escrow.deleteMany({ where: { OR: [{ buyerId: { in: [adminId, userId] } }, { sellerId: { in: [adminId, userId] } }] } });
            await prisma.auction.deleteMany({ where: { sellerId: { in: [adminId, userId] } } });
            await prisma.asset.deleteMany({ where: { ownerId: { in: [adminId, userId] } } });
            await prisma.user.deleteMany({ where: { id: { in: [adminId, userId] } } });
        }

    });

    beforeEach(async () => {
        // Create a pending asset
        const asset = await prisma.asset.create({
            data: {
                title: "Test Asset",
                description: "Description",
                images: ["image1.jpg"],
                metadata: {
                    condition: "New",
                    year: 2023,
                    material: "Metal",
                    category: "Art",
                },
                ownerId: userId,
                status: "PENDING_REVIEW",
            },
        });
        pendingAssetId = asset.id;
    });

    afterEach(async () => {
        // Must delete dependent records first
        if (adminId && userId) {
            const ids = [adminId, userId];
            await prisma.bid.deleteMany({ where: { bidderId: { in: ids } } });
            await prisma.dispute.deleteMany({ where: { buyerId: { in: ids } } });
            await prisma.escrow.deleteMany({ where: { OR: [{ buyerId: { in: ids } }, { sellerId: { in: ids } }] } });
            await prisma.auction.deleteMany({ where: { sellerId: { in: ids } } });
            await prisma.asset.deleteMany({ where: { ownerId: { in: ids } } });
        }
    });

    it("should fetch pending assets for admin", async () => {
        const response = await request(app)
            .get("/api/v1/admin/assets/pending")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        const ids = response.body.map((a: any) => a.id);
        expect(ids).toContain(pendingAssetId);
    });

    it("should approve an asset", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/assets/${pendingAssetId}/approve`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("APPROVED");

        const updatedAsset = await prisma.asset.findUnique({
            where: { id: pendingAssetId },
        });
        expect(updatedAsset?.status).toBe("APPROVED");
    });

    it("should reject an asset with reason", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/assets/${pendingAssetId}/reject`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ reason: "Insufficient proof of authenticity" });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("REJECTED");
        expect(response.body.rejectionReason).toBe("Insufficient proof of authenticity");

        const updatedAsset = await prisma.asset.findUnique({
            where: { id: pendingAssetId },
        });
        expect(updatedAsset?.status).toBe("REJECTED");
        expect(updatedAsset?.rejectionReason).toBe("Insufficient proof of authenticity");
    });

    it("should deny non-admin access", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/assets/${pendingAssetId}/approve`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(response.status).toBe(403);
    });

    it("should fetch admin stats", async () => {
        // 1. Asset for Dispute
        const disputeAsset = await prisma.asset.create({
            data: {
                title: "Dispute Asset",
                description: "Desc",
                images: [],
                metadata: {},
                ownerId: userId,
                status: "APPROVED"
            }
        });

        // 2. Auction
        const auction = await prisma.auction.create({
            data: {
                assetId: disputeAsset.id,
                sellerId: userId,
                startTime: new Date(),
                endTime: new Date(Date.now() + 10000),
                status: "ENDED" // Ended to have escrow
            }
        });

        // 3. Escrow
        const escrow = await prisma.escrow.create({
            data: {
                auctionId: auction.id,
                buyerId: adminId, // Using admin as buyer
                sellerId: userId,
                amount: 100,
                status: "HOLDING"
            }
        });

        // 4. Dispute
        await prisma.dispute.create({
            data: {
                escrowId: escrow.id,
                buyerId: adminId,
                reason: "Fake Item",
                status: "OPEN"
            }
        });

        const response = await request(app)
            .get("/api/v1/dashboard/admin")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        // Check specific structure
        expect(response.body.assetsReview.pending).toBeGreaterThanOrEqual(1);
        expect(response.body.disputes.open).toBeGreaterThanOrEqual(1);
        expect(response.body.auctions).toBeDefined();
        expect(response.body.escrows).toBeDefined();
    });
});
