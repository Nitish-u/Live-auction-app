import { z } from 'zod';

export const getPublicAssetsSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 12)),
        sellerId: z.string().uuid().optional(),
        hasAuction: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
    }),
});

export const getSellerAssetsSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 12)),
    }),
});
