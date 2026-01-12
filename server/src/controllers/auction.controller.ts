import { Request, Response, NextFunction } from "express";
import { auctionService } from "../services/auction.service";
import { createAuctionSchema, listAuctionsSchema } from "../validators/auction.schema";
import { AuctionStatus } from "@prisma/client";

export const createAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const body = createAuctionSchema.parse(req.body);
        const auction = await auctionService.createAuction(userId, body);
        res.status(201).json(auction);
    } catch (error) {
        next(error);
    }
};

export const listAuctions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = listAuctionsSchema.parse(req.query);
        const result = await auctionService.listAuctions({
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy as "startTime" | "endTime",
            sortOrder: query.sortOrder as "asc" | "desc",
            status: query.status as AuctionStatus | undefined,
            assetId: query.assetId,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Auction ID is required" });
            return;
        }
        const auction = await auctionService.getAuction(id);
        res.json(auction);
    } catch (error) {
        next(error);
    }
};

export const cancelAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Auction ID is required" });
            return;
        }

        const auction = await auctionService.cancelAuction(userId, id);
        res.json(auction);
    } catch (error) {
        next(error);
    }
};
