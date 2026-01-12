import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { notificationService } from "../../src/services/notification.service";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const createUser = async (email: string, role: "USER" | "ADMIN" = "USER") => {
    const user = await prisma.user.create({
        data: {
            email,
            password: "hashedpassword",
            role,
            displayName: "Test User",
            status: "ACTIVE"
        }
    });
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, sub: user.id },
        process.env.JWT_SECRET || "supersecret",
        { expiresIn: "1h" }
    );
    return { user, token };
};

describe("FEATURE 18: Notifications", () => {
    let userA: any, tokenA: string;
    let userB: any, tokenB: string;

    beforeEach(async () => {
        // Clean up
        await prisma.notification.deleteMany();
        await prisma.auditLog.deleteMany();
        await prisma.dispute.deleteMany();
        await prisma.escrow.deleteMany();
        await prisma.bid.deleteMany();
        await prisma.message.deleteMany();
        await prisma.auction.deleteMany();
        await prisma.asset.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();

        // Setup Users
        const uA = await createUser("userA@example.com");
        userA = uA.user;
        tokenA = uA.token;

        const uB = await createUser("userB@example.com");
        userB = uB.user;
        tokenB = uB.token;

        // Create Wallets
        await prisma.wallet.create({ data: { userId: userA.id, balance: 1000 } });
        await prisma.wallet.create({ data: { userId: userB.id, balance: 1000 } });
    });

    it("should retrieve notifications for user", async () => {
        await notificationService.create({
            userId: userA.id,
            type: "OUTBID",
            message: "Test Notification"
        });

        const res = await request(app)
            .get("/api/v1/notifications")
            .set("Authorization", `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].message).toBe("Test Notification");
        expect(res.body.unreadCount).toBe(1);
    });

    it("should mark notification as read", async () => {
        const note = await notificationService.create({
            userId: userA.id,
            type: "OUTBID",
            message: "Test Notification"
        });

        const res = await request(app)
            .post(`/api/v1/notifications/${note.id}/read`)
            .set("Authorization", `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.read).toBe(true);

        const check = await prisma.notification.findUnique({ where: { id: note.id } });
        expect(check?.read).toBe(true);
    });

    it("should not allow reading another user's notification", async () => {
        const note = await notificationService.create({
            userId: userA.id,
            type: "OUTBID",
            message: "Test Notification"
        });

        const res = await request(app)
            .post(`/api/v1/notifications/${note.id}/read`)
            .set("Authorization", `Bearer ${tokenB}`);

        expect(res.status).toBe(403);
    });

    it("should trigger OUTBID notification", async () => {
        // 1. Create Asset & Auction (User A is seller)
        const asset = await prisma.asset.create({
            data: {
                title: "Test Asset",
                description: "Desc",
                ownerId: userA.id,
                images: [],
                metadata: {},
                status: "APPROVED"
            }
        });
        const auction = await prisma.auction.create({
            data: {
                assetId: asset.id,
                sellerId: userA.id,
                startTime: new Date(),
                endTime: new Date(Date.now() + 10000),
                status: "LIVE"
            }
        });

        // 2. User B bids (First bid)
        await request(app)
            .post("/api/v1/bids")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ auctionId: auction.id, amount: 100 });

        // 3. User C bids (Outbids B)
        const uC = await createUser("userC@example.com");
        await prisma.wallet.create({ data: { userId: uC.user.id, balance: 1000 } });

        await request(app)
            .post("/api/v1/bids")
            .set("Authorization", `Bearer ${uC.token}`)
            .send({ auctionId: auction.id, amount: 110 });

        // 4. Check User B notifications
        const notifications = await prisma.notification.findMany({ where: { userId: userB.id } });
        expect(notifications).toHaveLength(1);
        const firstNotification = notifications[0];
        expect(firstNotification).toBeDefined();
        if (firstNotification) {
            expect(firstNotification.type).toBe("OUTBID");
            expect(firstNotification.message).toContain("outbid on Test Asset");
        }
    });
});
