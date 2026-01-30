import { Notification, NotificationType } from "@prisma/client";
import prisma from "../config/prisma";
import { MailService } from "../modules/mail/mail.service";

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
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                message: data.message,
                metadata: (data.metadata || {}) as any,
                updatedAt: new Date(),
            },
        });

        // Trigger Side-effect: Email
        this.sendEmailNotification(data.userId, data.type, data.metadata || {}).catch(err => {
            console.error(`[NOTIFICATION] Failed to send email for type ${data.type}:`, err);
        });

        return notification;
    }

    private async sendEmailNotification(userId: string, type: NotificationType, metadata: Record<string, any>) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.email) return;

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        if (type === 'OUTBID') {
            await MailService.sendMail({
                to: user.email,
                subject: 'You have been outbid',
                templateName: 'outbid',
                variables: {
                    AUCTION_TITLE: metadata.auctionTitle || 'Auction',
                    CURRENT_BID: metadata.currentBid || '0',
                    AUCTION_LINK: `${clientUrl}/auctions/${metadata.auctionId}`
                }
            });
        }
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
