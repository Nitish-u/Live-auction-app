import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { asyncHandler } from "../utils/asyncHandler";

export class NotificationController {
    getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
        const user = req.user;
        if (!user || typeof user.id !== 'string') {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId: string = user.id;

        const unreadOnly = req.query.unread === "true";
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

        const notifications = await notificationService.getUserNotifications(userId, {
            unreadOnly,
            limit,
        });

        const unreadCount = await notificationService.getUnreadCount(userId);

        res.json({
            items: notifications,
            unreadCount,
        });
    });

    markAsRead = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId || typeof userId !== 'string') {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: "Invalid notification ID" });
        }

        try {
            const notification = await notificationService.markAsRead(id, userId);
            res.json(notification);
        } catch (error: any) {
            if (error.message === "Notification not found") {
                return res.status(404).json({ message: "Notification not found" });
            }
            if (error.message === "Unauthorized to access this notification") {
                return res.status(403).json({ message: "Forbidden" });
            }
            throw error;
        }
    });
}

export const notificationController = new NotificationController();
