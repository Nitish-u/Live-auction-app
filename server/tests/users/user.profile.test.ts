import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { password } from "../../src/utils/password";
import { token } from "../../src/utils/jwt";

const prisma = new PrismaClient();

describe("FEATURE 13: User Profiles", () => {
    const user1Email = `profile-test-1-${Date.now()}@example.com`;
    const user2Email = `profile-test-2-${Date.now()}@example.com`;
    const userPassword = "securePassword123";

    let user1Id: string;
    let user1Token: string;
    let user2Id: string;

    beforeAll(async () => {
        // Create User 1
        const hashedPwd = await password.hash(userPassword);
        const u1 = await prisma.user.create({
            data: { email: user1Email, password: hashedPwd }
        });
        user1Id = u1.id;
        user1Token = token.sign({ sub: u1.id, role: u1.role });

        // Create User 2
        const u2 = await prisma.user.create({
            data: { email: user2Email, password: hashedPwd, displayName: "Original Name" }
        });
        user2Id = u2.id;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: { in: [user1Email, user2Email] } } });
        await prisma.$disconnect();
    });

    describe("GET /api/v1/users/:id (Public Profile)", () => {
        it("should return public profile for existing user", async () => {
            const response = await request(app).get(`/api/v1/users/${user2Id}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("id", user2Id);
            expect(response.body).toHaveProperty("displayName", "Original Name");
            expect(response.body).not.toHaveProperty("email");
            expect(response.body).not.toHaveProperty("password");
            expect(response.body).not.toHaveProperty("dateOfBirth"); // Just random check
            expect(response.body).toHaveProperty("createdAt");
        });

        it("should return 404 for non-existent user", async () => {
            const response = await request(app).get("/api/v1/users/non-existent-uuid");
            expect(response.status).toBe(404); // Or 500 if invalid UUID, but let's assume valid UUID format but not found
            // Actually if I pass 'non-existent-uuid' and it's not a UUID, prisma might throw.
            // But for this test let's create a fake UUID.
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const response2 = await request(app).get(`/api/v1/users/${fakeId}`);
            expect(response2.status).toBe(404);
        });
    });

    describe("GET /api/v1/users/me (Private Profile)", () => {
        it("should return own profile with private fields", async () => {
            const response = await request(app)
                .get("/api/v1/users/me")
                .set("Authorization", `Bearer ${user1Token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("id", user1Id);
            expect(response.body).toHaveProperty("email", user1Email); // Validating private field
        });

        it("should fail without auth", async () => {
            const response = await request(app).get("/api/v1/users/me");
            expect(response.status).toBe(401); // Or 403 or 500 depending on middleware
        });
    });

    describe("PUT /api/v1/users/me (Update Profile)", () => {
        it("should update allowed fields", async () => {
            const updateData = {
                displayName: "Updated Name",
                bio: "New Bio",
                avatarUrl: "https://example.com/avatar.jpg"
            };

            const response = await request(app)
                .put("/api/v1/users/me")
                .set("Authorization", `Bearer ${user1Token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.displayName).toBe(updateData.displayName);
            expect(response.body.bio).toBe(updateData.bio);
            expect(response.body.avatarUrl).toBe(updateData.avatarUrl);

            // Verify persistence
            const check = await prisma.user.findUnique({ where: { id: user1Id } });
            expect(check?.displayName).toBe(updateData.displayName);
        });

        it("should allow partial updates", async () => {
            const updateData = {
                bio: "Partial Update Bio"
            };

            const response = await request(app)
                .put("/api/v1/users/me")
                .set("Authorization", `Bearer ${user1Token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.bio).toBe(updateData.bio);
            // displayName should remain unchanged (from previous test which set it to "Updated Name")
            expect(response.body.displayName).toBe("Updated Name");
        });

        it("should validate input (fail on invalid data)", async () => {
            const invalidData = {
                displayName: "A", // Too short (min 2)
                avatarUrl: "invalid-url"
            };

            const response = await request(app)
                .put("/api/v1/users/me")
                .set("Authorization", `Bearer ${user1Token}`)
                .send(invalidData);

            expect(response.status).toBe(400);
        });
    });
});
