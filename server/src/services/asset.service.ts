import { PrismaClient } from "@prisma/client";
import { createAssetSchema, updateAssetSchema } from "../validators/asset.schema";
import { z } from "zod";

const prisma = new PrismaClient();

export const assetService = {
    createAsset: async (userId: string, input: z.infer<typeof createAssetSchema>) => {
        return await prisma.asset.create({
            data: {
                ...input,
                metadata: input.metadata ?? {},
                ownerId: userId,
                status: "PENDING_REVIEW" as any,
            },
        });
    },

    getMyAssets: async (userId: string) => {
        return await prisma.asset.findMany({
            where: { ownerId: userId },
            include: {
                owner: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                auction: true, // Also include auction status if needed
            },
            orderBy: { createdAt: "desc" },
        });
    },

    updateAsset: async (userId: string, assetId: string, input: z.infer<typeof updateAssetSchema>) => {
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });

        if (!asset) {
            throw { statusCode: 404, message: "Asset not found", code: "NOT_FOUND" };
        }

        if (asset.ownerId !== userId) {
            throw { statusCode: 403, message: "Not authorized", code: "FORBIDDEN" };
        }

        if (asset.status !== "DRAFT") {
            throw { statusCode: 403, message: "Only drafts can be updated", code: "FORBIDDEN" };
        }

        const data = Object.fromEntries(
            Object.entries(input).filter(([_, v]) => v !== undefined)
        );

        return await prisma.asset.update({
            where: { id: assetId },
            data,
        });
    },

    getAssetById: async (assetId: string) => {
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
            include: {
                owner: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        email: true,
                    },
                },
            },
        });

        if (!asset) {
            throw { statusCode: 404, message: "Asset not found", code: "NOT_FOUND" };
        }

        return asset;
    },

    submitAsset: async (userId: string, assetId: string) => {
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });

        if (!asset) {
            throw { statusCode: 404, message: "Asset not found", code: "NOT_FOUND" };
        }

        if (asset.ownerId !== userId) {
            throw { statusCode: 403, message: "Not authorized", code: "FORBIDDEN" };
        }

        if (asset.status !== "DRAFT") {
            throw { statusCode: 400, message: "Asset is not in DRAFT status", code: "INVALID_STATUS" };
        }

        return await prisma.asset.update({
            where: { id: assetId },
            data: { status: "PENDING_REVIEW" },
        });
    },
};
