import { Request, Response, NextFunction } from "express";
import { walletService } from "../services/wallet.service";
import { addFundsSchema } from "../validators/wallet.schema";

export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.sub;
        const wallet = await walletService.getWallet(userId);
        res.json(wallet);
    } catch (error) {
        next(error);
    }
};

export const addFunds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.sub;
        const { amount } = addFundsSchema.parse(req.body);
        const updatedWallet = await walletService.addFunds(userId, amount);
        res.json(updatedWallet);
    } catch (error) {
        next(error);
    }
};
