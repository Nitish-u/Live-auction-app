
import { Request, Response, NextFunction } from "express";
import { disputeService } from "../services/dispute.service";

export const raiseDispute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Escrow ID
        const { reason } = req.body;
        const userId = req.user?.sub;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!reason) {
            res.status(400).json({ message: "Reason is required" });
            return;
        }

        const dispute = await disputeService.raiseDispute(userId as string, id as string, reason as string);
        res.status(201).json(dispute);
    } catch (error) {
        next(error);
    }
};

export const listDisputes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Assume admin check middleware is used or check role here
        // The service doesn't enforce role reading, so controller must check "isAdmin"?
        // Typically role guard middleware does interception.
        const disputes = await disputeService.listDisputes();
        res.status(200).json(disputes);
    } catch (error) {
        next(error);
    }
};

export const resolveDispute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Dispute ID
        const { resolution } = req.body;
        const adminId = req.user?.sub;

        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!["REFUND", "RELEASE"].includes(resolution)) {
            res.status(400).json({ message: "Invalid resolution" });
            return;
        }

        const dispute = await disputeService.resolveDispute(adminId as string, id as string, resolution as "REFUND" | "RELEASE");
        res.status(200).json(dispute);
    } catch (error) {
        next(error);
    }
};
