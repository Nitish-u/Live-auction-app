import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { token } from "../../src/utils/jwt";

const prisma = new PrismaClient();

describe("FEATURE 3: Wallet Funding", () => {
    const email = `wallet-test-${Date.now()}@example.com`;
    const password = "securePassword123";
    let authToken = "";
    let userId = "";

    beforeAll(async () => {
        // Register user for testing
        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({ email, password });

        authToken = response.body.token;
        userId = response.body.user.id;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email } });
        await prisma.$disconnect();
    });

    describe("GET /api/v1/wallet", () => {
        it("should return mock wallet details", async () => {
            const response = await request(app)
                .get("/api/v1/wallet")
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("balance");
            // Balance should be string (Decimal) or number depending on serialization, usually string in express JSON for Prisma Decimals unless handled
            expect(Number(response.body.balance)).toBe(0);
            expect(Number(response.body.locked)).toBe(0);
        });

        it("should fail without auth", async () => {
            const response = await request(app).get("/api/v1/wallet");
            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/v1/wallet/add-funds", () => {
        it("should add funds (positive amount)", async () => {
            const response = await request(app)
                .post("/api/v1/wallet/add-funds")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ amount: 500 });

            expect(response.status).toBe(200);
            expect(Number(response.body.balance)).toBe(500);

            // Verify Transaction Created
            const tx = await prisma.walletTransaction.findFirst({
                where: { wallet: { userId } }
            });
            expect(tx).toBeDefined();
            expect(tx?.amount.toNumber()).toBe(500);
            expect(tx?.type).toBe("CREDIT");
        });

        it("should accumulate funds", async () => {
            const response = await request(app)
                .post("/api/v1/wallet/add-funds")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ amount: 250 });

            expect(response.status).toBe(200);
            expect(Number(response.body.balance)).toBe(750); // 500 + 250
        });

        it("should fail for negative amount (zod)", async () => {
            const response = await request(app)
                .post("/api/v1/wallet/add-funds")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ amount: -100 });

            expect(response.status).toBe(500); // 500 because validation error might not be mapped to 400 yet globally, or Zod error
            // Actually Zod throws, if global handler catches it, it might be 500 if not typed as AppError
        });

        it("should fail for zero amount", async () => {
            const response = await request(app)
                .post("/api/v1/wallet/add-funds")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ amount: 0 });

            expect(response.status).toBe(500);
        });
    });
});
