import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export const walletService = {
    getWallet: async (userId: string) => {
        return await prisma.wallet.findUniqueOrThrow({
            where: { userId },
            select: { balance: true, locked: true },
        });
    },

    addFunds: async (userId: string, amount: number) => {
        return await prisma.$transaction(async (tx) => {
            // 1. Get wallet
            const wallet = await tx.wallet.findUniqueOrThrow({
                where: { userId },
            });

            // 2. Create Transaction
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: "CREDIT",
                    reference: "MOCK_TOPUP",
                },
            });

            // 3. Update Balance
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                },
                select: { balance: true, locked: true },
            });

            return updatedWallet;
        });
    },
};
