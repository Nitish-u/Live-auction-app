
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { token } from "../../src/utils/jwt";
import * as socketServer from "../../src/socket/socketServer";

// Mock Socket
const mockEmit = vi.fn();
const mockTo = vi.fn(() => ({ emit: mockEmit }));
const mockIO = { to: mockTo };

describe("Feature 10: Realtime Bidding Socket", () => {
    let auctionId: string;
    let bidder1Id: string;
    let bidder1Token: string;

    beforeAll(async () => {
        // Cleanup
        // Cleanup
        await prisma.bidProposal.deleteMany({
            where: {
                OR: [
                    { seller: { email: { in: ["socket-seller@example.com", "socket-bidder@example.com"] } } },
                    { buyer: { email: { in: ["socket-seller@example.com", "socket-bidder@example.com"] } } }
                ]
            }
        });
        await prisma.bid.deleteMany({
            where: { bidder: { email: { in: ["socket-seller@example.com", "socket-bidder@example.com"] } } }
        });
        await prisma.auction.deleteMany({
            where: { seller: { email: { in: ["socket-seller@example.com", "socket-bidder@example.com"] } } }
        });
        await prisma.asset.deleteMany({
            where: { owner: { email: { in: ["socket-seller@example.com", "socket-bidder@example.com"] } } }
        });
        await prisma.wallet.deleteMany({
            where: { user: { email: { in: ["socket-seller@example.com", "socket-bidder@example.com"] } } }
        });
        await prisma.user.deleteMany({
            where: { email: { in: ["socket-seller@example.com", "socket-bidder@example.com"] } }
        });

        // Setup User
        const seller = await prisma.user.create({
            data: { email: "socket-seller@example.com", password: "hash", role: "USER", wallet: { create: {} } }
        });

        const bidder = await prisma.user.create({
            data: { email: "socket-bidder@example.com", password: "hash", role: "USER", wallet: { create: { balance: 1000, locked: 0 } } }
        });
        bidder1Id = bidder.id;
        bidder1Token = token.sign({ sub: bidder.id, role: "USER" });

        // Setup Auction
        const asset = await prisma.asset.create({
            data: { title: "Socket Item", description: "Desc", images: [], metadata: {}, status: "APPROVED", ownerId: seller.id }
        });

        const auction = await prisma.auction.create({
            data: {
                assetId: asset.id, sellerId: seller.id, status: "LIVE",
                startTime: new Date(), endTime: new Date(Date.now() + 100000)
            }
        });
        auctionId = auction.id;
    });

    beforeEach(() => {
        // Spy on getIO
        vi.spyOn(socketServer, 'getIO').mockReturnValue(mockIO as any);
        mockEmit.mockClear();
        mockTo.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(async () => {

    });

    it("should emit bid_placed socket event on successful bid", async () => {
        const response = await request(app)
            .post("/api/v1/bids")
            .set("Authorization", `Bearer ${bidder1Token}`)
            .send({
                auctionId,
                amount: 100
            });

        expect(response.status).toBe(201);

        // Verify Socket Emit
        expect(socketServer.getIO).toHaveBeenCalled();
        expect(mockTo).toHaveBeenCalledWith(`auction:${auctionId}`);
        expect(mockEmit).toHaveBeenCalledWith("bid_placed", expect.objectContaining({
            auctionId: auctionId,
            amount: "100",
            bidder: expect.objectContaining({
                id: bidder1Id,
                email: "socket-bidder@example.com"
            })
        }));
    });
});
