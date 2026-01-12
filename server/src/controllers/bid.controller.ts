import { Request, Response, NextFunction } from "express";
import { placeBidSchema } from "../validators/bid.schema";
import { bidService } from "../services/bid.service";

export const placeBid = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const body = placeBidSchema.parse(req.body);
        const result = await bidService.placeBid(userId, body);

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const getAuctionBids = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Auction ID is required" });
            return;
        }

        const bids = await bidService.getBids(id);
        res.json(bids);
    } catch (error) {
        next(error);
    }
};
