import 'dotenv/config';
import { describe, it, expect } from "vitest";
import prisma from "../../src/config/prisma";

describe("FEATURE 1: User & Wallet Schema", () => {
    it("should enforce unique email constraint", async () => {
        const email = `test-${Date.now()}@example.com`;

        await prisma.user.create({
            data: { email, password: "hashed_password" }
        });

        await expect(
            prisma.user.create({
                data: { email, password: "another_password" }
            })
        ).rejects.toThrow();
    });

    it("should enforce wallet-user relationship and balance constraints", async () => {
        const email = `wallet-${Date.now()}@example.com`;

        const user = await prisma.user.create({
            data: { email, password: "hashed_password" }
        });

        // Create wallet
        const wallet = await prisma.wallet.create({
            data: { userId: user.id }
        });

        expect(wallet).toBeDefined();
        expect(wallet.balance.toNumber()).toBe(0);

        // Try negative balance (Check Constraint)
        await expect(
            prisma.$executeRaw`UPDATE "Wallet" SET balance = -10 WHERE id = ${wallet.id}`
        ).rejects.toThrow();
    });
});
