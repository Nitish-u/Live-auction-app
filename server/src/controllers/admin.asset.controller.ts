import { Request, Response, NextFunction } from "express";
import { adminAssetService } from "../services/admin.asset.service";
import { rejectAssetSchema } from "../validators/admin.asset.schema";

export const getPendingAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assets = await adminAssetService.getPendingAssets();
        res.json(assets);
    } catch (error) {
        next(error);
    }
};

export const approveAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Asset ID required" };

        const asset = await adminAssetService.approveAsset(id);
        res.json(asset);
    } catch (error) {
        next(error);
    }
};

export const rejectAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Asset ID required" };

        const body = rejectAssetSchema.parse(req.body);
        const asset = await adminAssetService.rejectAsset(id, body.reason);
        res.json(asset);
    } catch (error) {
        next(error);
    }
};
