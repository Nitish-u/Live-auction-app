import { Notification, NotificationType } from "@prisma/client";
import prisma from "../config/prisma";

export class NotificationService {
    /**
     * Create a new notification
     */
    async create(data: {
        userId: string;
        type: NotificationType;
        message: string;
        metadata?: Record<string, any>;
    }): Promise<Notification> {
        return prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                message: data.message,
                metadata: (data.metadata || {}) as any,
            },
        });
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(
        userId: string,
        options: { unreadOnly?: boolean; limit?: number } = {}
    ): Promise<Notification[]> {
        const { unreadOnly = false, limit = 20 } = options;

        return prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { read: false } : {}),
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });
    }

    /**
     * Mark a notification as read
     * Idempotent: successful even if already read
     */
    async markAsRead(id: string, userId: string): Promise<Notification> {
        // First check ownership
        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            throw new Error("Notification not found");
        }

        if (notification.userId !== userId) {
            throw new Error("Unauthorized to access this notification");
        }

        // Only update if not already read (optimization)
        if (notification.read) {
            return notification;
        }

        return prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }

    /**
     * Get unread count for a user (useful for badge)
     */
    async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });
    }
}

export const notificationService = new NotificationService();
