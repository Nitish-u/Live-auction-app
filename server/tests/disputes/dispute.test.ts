
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { token } from "../../src/utils/jwt";
import { expect, describe, it, beforeAll, afterAll } from "vitest";

import prisma from "../../src/config/prisma";

describe("FEATURE 12: Dispute Resolution", () => {
    let adminToken: string;
    let buyerToken: string;
    let sellerToken: string;
    let buyerId: string;
    let sellerId: string;
    let adminId: string;
    let auctionId: string;
    let escrowId: string;

    beforeAll(async () => {
        const emails = ["admin@platform.com", "seller@platform.com", "buyer@platform.com"];
        await prisma.auditLog.deleteMany(); // Keeping global for audit log if no actor link easily available or safe
        await prisma.dispute.deleteMany({ where: { buyer: { email: { in: emails } } } });
        await prisma.escrow.deleteMany({ where: { OR: [{ buyer: { email: { in: emails } } }, { seller: { email: { in: emails } } }] } });
        await prisma.bid.deleteMany({ where: { bidder: { email: { in: emails } } } });
        await prisma.auction.deleteMany({ where: { seller: { email: { in: emails } } } });
        await prisma.wallet.deleteMany({ where: { user: { email: { in: emails } } } });
        await prisma.user.deleteMany({ where: { email: { in: emails } } });

        // Admin
        const admin = await prisma.user.create({
            data: { email: "admin@platform.com", password: "hash", role: "ADMIN", wallet: { create: {} } }
        });
        adminId = admin.id;
        adminToken = token.sign({ sub: admin.id, role: "ADMIN" });

        // Seller
        const seller = await prisma.user.create({
            data: { email: "seller@platform.com", password: "hash", role: "USER", wallet: { create: { balance: 0 } } }
        });
        sellerId = seller.id;
        sellerToken = token.sign({ sub: seller.id, role: "USER" });

        // Buyer
        const buyer = await prisma.user.create({
            data: { email: "buyer@platform.com", password: "hash", role: "USER", wallet: { create: { balance: 1000 } } }
        });
        buyerId = buyer.id;
        buyerToken = token.sign({ sub: buyer.id, role: "USER" });

        // Asset & Auction
        const asset = await prisma.asset.create({
            data: { title: "Dispute Item", description: "Desc", images: [], metadata: {}, status: "APPROVED", ownerId: sellerId }
        });

        const auction = await prisma.auction.create({
            data: {
                assetId: asset.id, sellerId, status: "ENDED",
                startTime: new Date(), endTime: new Date()
            }
        });
        auctionId = auction.id;

        // Create Escrow manually ( simulating settlement)
        const escrow = await prisma.escrow.create({
            data: {
                auctionId,
                buyerId,
                sellerId,
                amount: 500,
                status: "HOLDING"
            }
        });
        escrowId = escrow.id;
    });

    afterAll(async () => {

    });

    it("should allow BUYER to raise a dispute", async () => {
        const res = await request(app)
            .post(`/api/v1/escrows/${escrowId}/dispute`)
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ reason: "Item broken" });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe("OPEN");
        expect(res.body.reason).toBe("Item broken");
    });

    it("should BLOCK double dispute creation", async () => {
        const res = await request(app)
            .post(`/api/v1/escrows/${escrowId}/dispute`)
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ reason: "Again" });

        expect(res.status).toBe(400);
        expect(res.body.error.message).toMatch(/exists/);
    });

    it("should BLOCK non-admin from resolving", async () => {
        const dispute = await prisma.dispute.findUnique({ where: { escrowId } });
        const res = await request(app)
            .post(`/api/v1/admin/disputes/${dispute?.id}/resolve`)
            .set("Authorization", `Bearer ${sellerToken}`) // Seller tries to resolve
            .send({ resolution: "RELEASE" });

        expect(res.status).toBe(403);
    });

    it("should allow ADMIN to REFUND buyer", async () => {
        const dispute = await prisma.dispute.findUnique({ where: { escrowId } });

        const res = await request(app)
            .post(`/api/v1/admin/disputes/${dispute?.id}/resolve`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ resolution: "REFUND" });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("RESOLVED");

        // Verify Database State
        const updatedEscrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
        expect(updatedEscrow?.status).toBe("REFUNDED");

        const buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
        expect(Number(buyerWallet?.balance)).toBe(1500); // 1000 start + 500 refund (assuming settlement debited, but here we manually created escrow without debiting, so balance=1000 + 500 = 1500. Wait, manual setup didn't debit. Correct.)

        // Verify Audit Log
        const logs = await prisma.auditLog.findMany({ where: { action: "DISPUTE_RESOLVED_REFUND" } });
        expect(logs.length).toBe(1);
        expect(logs[0]?.actorId).toBe(adminId);
    });
});
