import { z } from "zod";

export const createAuctionSchema = z.object({
    assetId: z.string().uuid("Invalid asset ID format"),
    startTime: z.string().datetime().refine((val) => {
        // Start time must be at least 5 minutes in future
        return new Date(val).getTime() > Date.now() + 5 * 60 * 1000;
    }, "Start time must be at least 5 minutes in the future"),
    endTime: z.string().datetime(),
}).refine((data) => {
    // End time must be after start time
    return new Date(data.endTime) > new Date(data.startTime);
}, {
    message: "End time must be after start time",
    path: ["endTime"]
}).refine((data) => {
    // Duration must be <= 24 hours
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    const duration = end - start;
    const maxDuration = 24 * 60 * 60 * 1000;
    return duration <= maxDuration;
}, {
    message: "Auction duration cannot exceed 24 hours",
    path: ["endTime"]
});

export const listAuctionsSchema = z.object({
    page: z.number({ coerce: true }).min(1).default(1),
    limit: z.number({ coerce: true }).min(1).max(100).default(10),
    sortBy: z.enum(["startTime", "endTime"]).default("startTime"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    status: z.enum(["SCHEDULED", "LIVE", "ENDED"]).optional(),
    assetId: z.string().uuid().optional(),
});
