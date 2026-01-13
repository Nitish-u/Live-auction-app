import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { password } from "../../src/utils/password";

import prisma from "../../src/config/prisma";

describe("Password Reset Feature", () => {
    const email = `reset-test-${Date.now()}@example.com`;
    const userPassword = "securePassword123";
    const newPassword = "newSecurePassword456";
    let resetToken = "";

    // Setup user
    it("should register a user first", async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send({ email, password: userPassword });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email } });

    });

    describe("POST /api/v1/auth/forgot-password", () => {
        it("should return success message for valid email", async () => {
            const response = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({ email });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("sent you a password reset link");

            // Verify token created
            const tokenRecord = await prisma.passwordResetToken.findFirst({
                where: { user: { email } }
            });
            expect(tokenRecord).toBeDefined();
            resetToken = tokenRecord?.token || "";
        }, 15000);

        it("should return success message for non-existent email (security)", async () => {
            const response = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({ email: "start-non-existent@example.com" });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("sent you a password reset link");
        });
    });

    describe("POST /api/v1/auth/reset-password", () => {
        it("should fail with invalid token", async () => {
            const response = await request(app)
                .post("/api/v1/auth/reset-password")
                .send({ token: "invalid-token", newPassword });

            expect(response.status).toBe(400);
        });

        it("should reset password with valid token", async () => {
            const response = await request(app)
                .post("/api/v1/auth/reset-password")
                .send({ token: resetToken, newPassword });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("successfully reset");

            // Verify token is deleted
            const tokenRecord = await prisma.passwordResetToken.findUnique({
                where: { token: resetToken }
            });
            expect(tokenRecord).toBeNull();
        });

        it("should allow login with new password", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email, password: newPassword });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
        });

        it("should not allow login with old password", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email, password: userPassword });

            expect(response.status).toBe(401);
        });
    });
});
