import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("FEATURE 0: Health Check", () => {
    it("GET /api/v1/health should return 200 and correct structure", async () => {
        const response = await request(app).get("/api/v1/health");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("status", "ok");
        expect(response.body).toHaveProperty("env");
        expect(response.body).toHaveProperty("timestamp");
    });
});
