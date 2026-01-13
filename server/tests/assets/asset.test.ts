import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";

describe("FEATURE 4: Asset Creation", () => {
    const email = `asset-test-${Date.now()}@example.com`;
    const password = "securePassword123";
    let authToken = "";

    beforeAll(async () => {
        // Register user
        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({ email, password });

        authToken = response.body.token;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email } });

    });

    it("should perform full asset lifecycle", async () => {
        // 1. Create Asset (Auto-submits to PENDING_REVIEW)
        let response = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                title: "Lifecycle Asset",
                description: "Desc",
                images: ["http://img.com"],
                metadata: { color: "blue" }
            });

        expect(response.status).toBe(201);
        const myAssetId = response.body.id;
        expect(myAssetId).toBeDefined();
        expect(response.body.status).toBe("PENDING_REVIEW");
        console.log("Created Asset ID:", myAssetId);

        // 2. List My Assets
        response = await request(app)
            .get("/api/v1/assets/my")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        const assets = response.body.assets;
        expect(assets).toHaveLength(1);
        expect(assets[0].id).toBe(myAssetId);
        expect(assets[0].status).toBe("PENDING_REVIEW");

        // 3. Try Update (Should Fail as it is not DRAFT)
        response = await request(app)
            .put(`/api/v1/assets/${myAssetId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ title: "Updated Lifecycle Title" });

        expect(response.status).toBe(403);

        // 4. Try Submit (Should Fail as it is already PENDING_REVIEW)
        response = await request(app)
            .post(`/api/v1/assets/${myAssetId}/submit`)
            .set("Authorization", `Bearer ${authToken}`);

        // Status 400 because service checks for DRAFT status and throws "Asset is not in DRAFT status"
        expect(response.status).toBe(400);

        // 5. Update after Submit (Fail) - Redundant but keeping for completeness of test structure
        response = await request(app)
            .put(`/api/v1/assets/${myAssetId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ title: "Illegal Update" });

        expect(response.status).toBe(403);
    });

    it("should fail validation", async () => {
        const response = await request(app)
            .post("/api/v1/assets")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ title: "No" });
        expect(response.status).toBe(400); // 400 because ErrorHandler catches ZodError
    });
});
