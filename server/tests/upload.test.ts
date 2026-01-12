import request from "supertest"
import app from "../src/app"
import path from "path"
import { vi, describe, it, expect } from "vitest"

// Mock auth middleware
vi.mock("../src/middlewares/auth.middleware", () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: "test-user", role: "SELLER" }
        next()
    },
    authorize: (roles: any[]) => (req: any, res: any, next: any) => next()
}))

describe("Asset Upload", () => {
    it("should upload a single image", async () => {
        const response = await request(app)
            .post("/api/v1/upload/asset-images")
            .attach("images", Buffer.from("fake-image"), { filename: "test.jpg", contentType: "image/jpeg" })

        expect(response.status).toBe(200)
        expect(response.body.urls).toHaveLength(1)
        expect(response.body.urls[0]).toMatch(/\/uploads\/assets\//)
    })

    it("should reject non-image files", async () => {
        const response = await request(app)
            .post("/api/v1/upload/asset-images")
            .attach("images", Buffer.from("fake-text"), { filename: "test.txt", contentType: "text/plain" })

        expect(response.status).toBe(500) // The service throws Error, caught by 500 handler in route
        expect(response.body.error).toContain("Invalid file type")
    })

    it("should reject more than 5 files", async () => {
        const req = request(app).post("/api/v1/upload/asset-images")

        for (let i = 0; i < 6; i++) {
            req.attach("images", Buffer.from("fake"), { filename: `test${i}.jpg`, contentType: "image/jpeg" })
        }

        const response = await req
        // Multer handles this limit? Route config says upload.array("images", 5)
        // Multer throws error on limit
        expect(response.status).toBe(500)
    })
})
