import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("FEATURE 31: Bid Proposal System", () => {
    const sellerEmail = `proposal-seller-${Date.now()}@example.com`;
    const buyerEmail = `proposal-buyer-${Date.now()}@example.com`;
    const password = "securePassword123";

    let sellerToken = "";
    let buyerToken = "";
    let sellerId = "";
    let buyerId = "";
    let assetId = "";
    let proposalId = "";

    beforeAll(async () => {
        // Register Seller
        const sellerRes = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: sellerEmail, password, displayName: "Seller" });
        sellerToken = sellerRes.body.token;
        sellerId = sellerRes.body.user.id;

        // Register Buyer
        const buyerRes = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: buyerEmail, password, displayName: "Buyer" });
        buyerToken = buyerRes.body.token;
        buyerId = buyerRes.body.user.id;

        // Create Asset by Seller
        const assetRes = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                title: "Proposal Asset",
                description: "Asset for proposal testing",
                images: ["http://img.com"],
                metadata: { color: "red" }
            });
        assetId = assetRes.body.id;

        // Approve Asset (Manually via Prisma)
        await prisma.asset.update({
            where: { id: assetId },
            data: { status: "APPROVED" }
        });
    });

    afterAll(async () => {
        // Cleanup proposals first
        await prisma.bidProposal.deleteMany({
            where: {
                OR: [
                    { buyerId: { in: [sellerId, buyerId] } },
                    { sellerId: { in: [sellerId, buyerId] } }
                ]
            }
        });
        // Cleanup based on users (cascades to proposals, assets)
        await prisma.user.deleteMany({
            where: {
                email: { in: [sellerEmail, buyerEmail] }
            }
        });
        await prisma.$disconnect();
    });

    it("should create proposal", async () => {
        const response = await request(app)
            .post("/api/v1/proposals")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                assetId: assetId,
                proposedAmount: 500
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("PENDING");
        expect(response.body.buyerId).toBe(buyerId);
        expect(response.body.assetId).toBe(assetId);
        expect(Number(response.body.proposedAmount)).toBe(500);

        proposalId = response.body.id;
    });

    it("should prevent duplicate pending proposals", async () => {
        const response = await request(app)
            .post("/api/v1/proposals")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                assetId: assetId,
                proposedAmount: 600
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/already have a pending proposal/);
    });

    it("should list buyer sent proposals", async () => {
        const response = await request(app)
            .get("/api/v1/proposals/my-sent")
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].id).toBe(proposalId);
    });

    it("should list seller received proposals", async () => {
        const response = await request(app)
            .get("/api/v1/proposals/my-assets")
            .set("Authorization", `Bearer ${sellerToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].id).toBe(proposalId);
    });

    it("should counter proposal", async () => {
        // Seller counters
        const response = await request(app)
            .post(`/api/v1/proposals/${proposalId}/counter`)
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                proposedAmount: 600
            });

        expect(response.status).toBe(201);
        const newProposalId = response.body.id;
        expect(response.body.status).toBe("PENDING");
        expect(response.body.parentProposalId).toBe(proposalId);
        expect(response.body.buyerId).toBe(sellerId); // Seller is now the proposer
        expect(response.body.sellerId).toBe(buyerId); // Buyer is now the recipient
        expect(Number(response.body.proposedAmount)).toBe(600);

        // Check original proposal status
        const original = await prisma.bidProposal.findUnique({ where: { id: proposalId } });
        expect(original?.status).toBe("COUNTERED");

        // Update proposalId to the new one for next steps (Buyer Accepts)
        proposalId = newProposalId;
    });

    it("should accept proposal", async () => {
        // Buyer accepts the counter-offer
        const response = await request(app)
            .post(`/api/v1/proposals/${proposalId}/accept`)
            .set("Authorization", `Bearer ${buyerToken}`); // Buyer accepts seller's counter

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ACCEPTED");
    });
});
