import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("FEATURE 17: Change Password", () => {
    const email = `changepw-test-${Date.now()}@example.com`;
    const password = "originalPassword123";
    const newPassword = "newStrongPassword456";
    let authToken = "";
    let userId = "";

    beforeAll(async () => {
        // Register user
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

    describe("POST /api/v1/auth/change-password", () => {
        it("should fail without authentication", async () => {
            const response = await request(app)
                .post("/api/v1/auth/change-password")
                .send({ currentPassword: password, newPassword });

            expect(response.status).toBe(401);
        });

        it("should fail with incorrect current password", async () => {
            const response = await request(app)
                .post("/api/v1/auth/change-password")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ currentPassword: "wrongPassword", newPassword });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toMatch(/valid/i);
        });

        it("should fail with short new password", async () => {
            const response = await request(app)
                .post("/api/v1/auth/change-password")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ currentPassword: password, newPassword: "short" });

            expect(response.status).toBe(400); // Validation error
        });

        it("should change password successfully", async () => {
            const response = await request(app)
                .post("/api/v1/auth/change-password")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ currentPassword: password, newPassword });

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/success/i);
        });

        it("should fail login with old password", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email, password });

            expect(response.status).toBe(401);
        });

        it("should success login with new password", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email, password: newPassword });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
        });
    });
});
