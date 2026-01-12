
import { Request, Response, NextFunction } from "express";
import { messageService } from "../services/message.service";

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.sub;

        if (!userId || typeof userId !== 'string') {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!id) {
            res.status(400).json({ message: "Auction ID is required" });
            return;
        }

        const messages = await messageService.getMessages(id, userId);
        res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user?.sub;

        if (!userId || typeof userId !== 'string') {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!id) {
            res.status(400).json({ message: "Auction ID is required" });
            return;
        }

        if (typeof content !== 'string') {
            res.status(400).json({ message: "Content is required" });
            return;
        }

        const message = await messageService.sendMessage(id, userId, content);
        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
};
