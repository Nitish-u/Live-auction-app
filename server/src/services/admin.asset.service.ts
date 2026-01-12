import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const adminAssetService = {
    getPendingAssets: async () => {
        return await prisma.asset.findMany({
            where: { status: "PENDING_REVIEW" as "PENDING_REVIEW" },
            orderBy: { createdAt: "asc" },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    },

    approveAsset: async (assetId: string) => {
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });

        if (!asset) {
            throw { statusCode: 404, message: "Asset not found", code: "NOT_FOUND" };
        }

        if (asset.status !== "PENDING_REVIEW" as "PENDING_REVIEW") {
            throw { statusCode: 400, message: "Asset is not pending review", code: "INVALID_STATUS" };
        }

        return await prisma.asset.update({
            where: { id: assetId },
            data: {
                status: "APPROVED" as "APPROVED",
                rejectionReason: null,
            },
            select: {
                id: true,
                status: true
            }
        });
    },

    rejectAsset: async (assetId: string, reason: string) => {
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });

        if (!asset) {
            throw { statusCode: 404, message: "Asset not found", code: "NOT_FOUND" };
        }

        if (asset.status !== "PENDING_REVIEW" as "PENDING_REVIEW") {
            throw { statusCode: 400, message: "Asset is not pending review", code: "INVALID_STATUS" };
        }

        return await prisma.asset.update({
            where: { id: assetId },
            data: {
                status: "REJECTED" as "REJECTED",
                rejectionReason: reason,
            },
        });
    },
};
