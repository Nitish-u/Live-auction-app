import { z } from "zod";

export const placeBidSchema = z.object({
    auctionId: z.string().uuid("Invalid auction ID"),
    amount: z.number().positive("Bid amount must be positive"),
});
