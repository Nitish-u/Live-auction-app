
import { Request, Response, NextFunction } from "express";
import { settlementService } from "../services/settlement.service";

export const settleAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Auction ID is required" });
            return;
        }

        // TODO: Strict Admin check needed here (or in middleware)
        // Feature spec says "Role: ADMIN (for MVP safety)"
        // Assuming `req.user` is populated by auth middleware.
        // if (req.user?.role !== 'ADMIN') ...

        const result = await settlementService.settleAuction(id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
