import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";

describe("FEATURE 2: Authentication", () => {
    const email = `auth-test-${Date.now()}@example.com`;
    const password = "securePassword123";
    let authToken = "";

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email } });

    });

    describe("POST /api/v1/auth/register", () => {
        it("should register a new user and return token + user info", async () => {
            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({ email, password });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("token");
            expect(response.body.user).toHaveProperty("email", email);
            expect(response.body.user).toHaveProperty("role", "USER");

            authToken = response.body.token;
        });

        it("should fail for duplicate email", async () => {
            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({ email, password });

            expect(response.status).toBe(400);
            // Note: In real app we map errors. Service throws {statusCode:400} but error handler needs to handle it
        });

        it("should have auto-created a wallet", async () => {
            const user = await prisma.user.findUnique({
                where: { email },
                include: { wallet: true }
            });
            expect(user?.wallet).toBeDefined();
            expect(user?.wallet?.balance.toNumber()).toBe(0);
        });
    });

    describe("POST /api/v1/auth/login", () => {
        it("should login with correct credentials", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email, password });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
        });

        it("should fail with wrong password", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email, password: "wrongpassword" });

            expect(response.status).toBe(401);
        });
    });

    describe("Protected Route /api/v1/auth/me", () => {
        it("should return user info with valid token", async () => {
            const response = await request(app)
                .get("/api/v1/auth/me")
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.user).toHaveProperty("sub");
        });

        it("should fail without token", async () => {
            const response = await request(app).get("/api/v1/auth/me");
            expect(response.status).toBe(401);
        });
    });
});
