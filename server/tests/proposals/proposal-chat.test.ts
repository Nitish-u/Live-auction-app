import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';

describe("Proposal Chat & Finalization", () => {
    const sellerEmail = `chat-seller-${Date.now()}@example.com`;
    const buyerEmail = `chat-buyer-${Date.now()}@example.com`;
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
                title: "Chat Asset",
                description: "Asset for chat testing",
                images: ["http://img.com"],
                metadata: { color: "blue" }
            });
        assetId = assetRes.body.id;

        // Approve Asset (Manually via Prisma)
        await prisma.asset.update({
            where: { id: assetId },
            data: { status: "APPROVED" }
        });

        // Create Proposal (Accepted)
        const proposal = await prisma.bidProposal.create({
            data: {
                assetId: assetId,
                sellerId: sellerId,
                buyerId: buyerId,
                proposedAmount: 1000,
                status: 'ACCEPTED'
            }
        });
        proposalId = proposal.id;
    });

    afterAll(async () => {
        if (!proposalId) return;
        await prisma.proposalMessage.deleteMany({ where: { proposalId } });
        await prisma.proposalFinalization.deleteMany({ where: { proposalId } });
        await prisma.bidProposal.delete({ where: { id: proposalId } });
        await prisma.asset.delete({ where: { id: assetId } });
        await prisma.user.deleteMany({ where: { email: { in: [sellerEmail, buyerEmail] } } });

    });

    it("should create message", async () => {
        const response = await request(app)
            .post(`/api/v1/proposals/${proposalId}/messages`)
            .set('Authorization', `Bearer ${buyerToken}`)
            .send({
                content: "Let's finalize this"
            });

        expect(response.status).toBe(201);
        expect(response.body.proposalId).toBe(proposalId);
        expect(response.body.content).toBe("Let's finalize this");
        expect(response.body.senderId).toBe(buyerId);
    });

    it("should list messages paginated", async () => {
        // Create another message
        await request(app)
            .post(`/api/v1/proposals/${proposalId}/messages`)
            .set('Authorization', `Bearer ${sellerToken}`)
            .send({
                content: "Sure, I found the docs"
            });

        const response = await request(app)
            .get(`/api/v1/proposals/${proposalId}/messages?limit=10&offset=0`)
            .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0].content).toBe("Sure, I found the docs"); // sorted DESC
    });

    it("should create finalization", async () => {
        const response = await request(app)
            .post(`/api/v1/proposals/${proposalId}/finalize`)
            .set('Authorization', `Bearer ${sellerToken}`)
            .send({});

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("PENDING");
        expect(Number(response.body.platformCharge)).toBe(25); // 1000 * 0.025
    });

    it("should upload docs", async () => {
        const buffer = Buffer.from('fake pdf content');

        const response = await request(app)
            .post(`/api/v1/proposals/${proposalId}/finalize/docs`)
            .set('Authorization', `Bearer ${sellerToken}`)
            .attach('files', buffer, 'cert.pdf');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.docsUrl)).toBe(true);
    });

    it("should confirm finalization", async () => {
        const response = await request(app)
            .post(`/api/v1/proposals/${proposalId}/finalize/confirm`)
            .set('Authorization', `Bearer ${sellerToken}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.sellerConfirmed).toBe(true);
        expect(response.body.status).toBe("PENDING");
    });

    it("should mark as BOTH_CONFIRMED when both confirmed", async () => {
        // Buyer confirms
        const response = await request(app)
            .post(`/api/v1/proposals/${proposalId}/finalize/confirm`)
            .set('Authorization', `Bearer ${buyerToken}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.buyerConfirmed).toBe(true);
        expect(response.body.status).toBe("BOTH_CONFIRMED");
        expect(response.body.finalizedAt).toBeDefined();
    });

    it("should get finalization status", async () => {
        const response = await request(app)
            .get(`/api/v1/proposals/${proposalId}/finalize`)
            .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("BOTH_CONFIRMED");
        expect(response.body.platformCharge).toBeDefined();
    });
});
