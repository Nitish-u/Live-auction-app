import { z } from 'zod';

export const updateProfileSchema = z.object({
    displayName: z.string().min(2).max(50).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional(),
});
