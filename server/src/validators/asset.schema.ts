import { z } from "zod";

export const createAssetSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(1, "Description is required"),
    images: z.array(z.string().url()).min(1, "At least one image URL is required"),
    metadata: z.record(z.any()).optional(),
});

export const updateAssetSchema = createAssetSchema.partial();
