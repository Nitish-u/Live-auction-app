import { Request, Response } from 'express';
import { fetchPublicAssets } from '../services/asset.gallery.service';
import { AppError } from '../utils/AppError';

export const getPublicAssets = async (req: Request, res: Response) => {
    // Because validation middleware with Zod.parseAsync doesn't automatically replace req.query
    // We need to parse it again or adjust the middleware.
    // Standard pattern: the middleware checks validity, but if transformations happen, we might parse again or attach to req.validated?
    // Let's just re-parse or easier: cast assuming valid since middleware passed.
    // Actually, Zod transforms string "1" to number 1. If I rely on req.query directly, it's still strings.
    // I should update validate.ts to assign back to req.
    const { page, limit, sellerId, hasAuction } = req.query as any;

    try {
        // Re-parsing to get transformed values
        // Or update middleware.
        // Let's update middleware in next step. For now, manual parsing or just accept strings if service handles them?
        // Service expects numbers.
        // So I'll do:
        const pageNum = page ? parseInt(page as string, 10) : 1;
        const limitNum = limit ? parseInt(limit as string, 10) : 12;
        const hasAuctionBool = hasAuction === 'true' ? true : hasAuction === 'false' ? false : undefined;

        const serviceParams: any = {
            page: pageNum,
            limit: limitNum,
        };
        if (sellerId) serviceParams.sellerId = sellerId as string;
        if (hasAuctionBool !== undefined) serviceParams.hasAuction = hasAuctionBool;

        const result = await fetchPublicAssets(serviceParams);
        res.json(result);
    } catch (error) {
        console.error('Error in getPublicAssets:', error);
        throw new AppError('Failed to fetch assets', 500);
    }
};

export const getSellerAssets = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit } = req.query as any;

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 12;

    try {
        // Reusing the service but enforcing sellerId
        const serviceParams: any = {
            page: pageNum,
            limit: limitNum,
            sellerId: id,
        };
        const result = await fetchPublicAssets(serviceParams);
        res.json(result);
    } catch (error) {
        console.error('Error in getSellerAssets:', error);
        throw new AppError('Failed to fetch seller assets', 500);
    }
};
