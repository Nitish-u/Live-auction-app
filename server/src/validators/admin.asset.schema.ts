import { z } from "zod";

export const rejectAssetSchema = z.object({
    reason: z.string().min(10, "Reason must be at least 10 characters"),
});
