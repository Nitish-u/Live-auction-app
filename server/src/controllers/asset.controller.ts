import { Request, Response, NextFunction } from "express";
import { assetService } from "../services/asset.service";
import { createAssetSchema, updateAssetSchema } from "../validators/asset.schema";

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.sub;
        const input = createAssetSchema.parse(req.body);
        const asset = await assetService.createAsset(userId, input);
        res.status(201).json(asset);
    } catch (error) {
        next(error);
    }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Asset ID required" };
        const asset = await assetService.getAssetById(id);
        res.json(asset);
    } catch (error) {
        next(error);
    }
};

export const getMyAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.sub;
        const assets = await assetService.getMyAssets(userId);
        res.json({ assets });
    } catch (error) {
        next(error);
    }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.sub;
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Asset ID required" };

        const input = updateAssetSchema.parse(req.body);
        const asset = await assetService.updateAsset(userId, id, input);
        res.json(asset);
    } catch (error) {
        next(error);
    }
};

export const submitAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.sub;
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Asset ID required" };

        const asset = await assetService.submitAsset(userId, id);
        res.json(asset);
    } catch (error) {
        next(error);
    }
};
