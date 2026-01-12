import request from "supertest";
import app from "../../src/app";
import { describe, it, expect, beforeAll } from "vitest";

describe("Create Asset", () => {
    let authToken: string;

    beforeAll(async () => {
        // Get auth token from login/register
        const email = `create-asset-test-${Date.now()}@example.com`;
        const password = "password123";

        await request(app)
            .post("/api/v1/auth/register")
            .send({ email, password });

        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password });

        authToken = loginRes.body.token;
    });

    it("should create asset with valid data", async () => {
        const response = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                title: "Test Asset",
                description: "A detailed description of the test asset",
                images: ["http://localhost:4000/uploads/assets/test.jpg"],
                metadata: {
                    year: 1950,
                    condition: "Excellent"
                }
            });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        // The requirement is that it auto-submits, so status should be PENDING_REVIEW
        expect(response.body.status).toBe("PENDING_REVIEW");
    });

    it("should reject missing required fields", async () => {
        const response = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                title: "Test"
                // Missing description, images
            });

        expect(response.status).toBe(400);
    });

    it("should reject unauthenticated requests", async () => {
        const response = await request(app)
            .post("/api/v1/assets")
            .send({
                title: "Test Asset",
                description: "...",
                images: ["url"]
            });

        expect(response.status).toBe(401);
    });
});
