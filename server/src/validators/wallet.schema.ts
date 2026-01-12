import { z } from "zod";

export const addFundsSchema = z.object({
    amount: z.number().positive("Amount must be positive").max(100000, "Limit exceeded"),
});
