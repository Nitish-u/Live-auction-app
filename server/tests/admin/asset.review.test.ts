import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";

describe("FEATURE 5: Admin Asset Review", () => {
    // Users
    const adminEmail = `admin-test-${Date.now()}@example.com`;
    const userEmail = `user-test-${Date.now()}@example.com`;
    const password = "securePassword123";

    let adminToken = "";
    let userToken = "";
    let adminId = "";
    let userId = "";

    // Assets
    let assetPendingId = "";
    let assetApprovedId = "";
    let assetRejectedId = "";

    beforeAll(async () => {
        // 1. Create ADMIN
        const adminRes = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: adminEmail, password });
        adminToken = adminRes.body.token;
        adminId = adminRes.body.user.id;

        // Force upgrade to ADMIN directly in DB (since register = USER)
        await prisma.user.update({
            where: { id: adminId },
            data: { role: "ADMIN" }
        });

        // Relogin to get new token with ADMIN role
        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: adminEmail, password });
        adminToken = loginRes.body.token;

        // 2. Create Normal USER
        const userRes = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: userEmail, password });
        userToken = userRes.body.token;
        userId = userRes.body.user.id;

        // 3. Create Assets as USER
        // Pending
        const res1 = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ title: "Pending Asset", description: "Desc", images: ["http://valid-url.com/img.png"] });

        assetPendingId = res1.body.id;
        // Check if ID exists before update
        if (!assetPendingId) throw new Error("Failed to create pending asset");

        await prisma.asset.update({ where: { id: assetPendingId }, data: { status: "PENDING_REVIEW" } });

        // Approved (Pre-set)
        const res2 = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ title: "Approved Asset", description: "Desc", images: ["http://valid-url.com/img.png"] });
        assetApprovedId = res2.body.id;
        await prisma.asset.update({ where: { id: assetApprovedId }, data: { status: "APPROVED" } });

        // Rejected (Pre-set)
        const res3 = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ title: "Rejected Asset", description: "Desc", images: ["http://valid-url.com/img.png"] });
        assetRejectedId = res3.body.id;
        await prisma.asset.update({
            where: { id: assetRejectedId },
            data: { status: "REJECTED", rejectionReason: "Bad" }
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } });

    });

    describe("Access Control", () => {
        it("should block non-admin users (403)", async () => {
            const response = await request(app)
                .get("/api/v1/admin/assets/pending")
                .set("Authorization", `Bearer ${userToken}`);
            expect(response.status).toBe(403);
        });

        it("should allow admin users", async () => {
            const response = await request(app)
                .get("/api/v1/admin/assets/pending")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
        });
    });

    describe("List Pending Assets", () => {
        it("should return only PENDING_REVIEW assets", async () => {
            const response = await request(app)
                .get("/api/v1/admin/assets/pending")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            const list = response.body;
            expect(Array.isArray(list)).toBe(true);

            // Check that ours is there
            const found = list.find((a: any) => a.id === assetPendingId);
            expect(found).toBeDefined();

            // Check no approved/rejected
            const foundAppr = list.find((a: any) => a.id === assetApprovedId);
            expect(foundAppr).toBeUndefined();
        });
    });

    describe("Approve Asset", () => {
        it("should approve pending asset", async () => {
            const response = await request(app)
                .post(`/api/v1/admin/assets/${assetPendingId}/approve`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("APPROVED");

            // Verify DB
            const updated = await prisma.asset.findUnique({ where: { id: assetPendingId } });
            expect(updated?.status).toBe("APPROVED");
        });

        it("should fail for non-pending asset", async () => {
            const response = await request(app)
                .post(`/api/v1/admin/assets/${assetApprovedId}/approve`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
        });
    });

    describe("Reject Asset", () => {
        // We'll create a fresh pending asset for rejection
        let rejectTargetId = "";

        it("should setup fresh asset", async () => {
            const res = await request(app)
                .post("/api/v1/assets")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ title: "To Reject", description: "Desc", images: ["http://valid-url.com/img.png"] });
            rejectTargetId = res.body.id;
            await prisma.asset.update({ where: { id: rejectTargetId }, data: { status: "PENDING_REVIEW" } });
            expect(rejectTargetId).toBeDefined();
        });

        it("should reject pending asset with reason", async () => {
            const response = await request(app)
                .post(`/api/v1/admin/assets/${rejectTargetId}/reject`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ reason: "This is a valid rejection reason." });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("REJECTED");
            expect(response.body.rejectionReason).toBe("This is a valid rejection reason.");
        });

        it("should require reason min length", async () => {
            const response = await request(app)
                .post(`/api/v1/admin/assets/${rejectTargetId}/reject`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ reason: "Short" });
            expect(response.status).toBe(400);
        });
    });
});
