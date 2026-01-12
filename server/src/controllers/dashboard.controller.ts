import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { AppError } from '../utils/AppError';

export const getSellerDashboard = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?.sub;
        if (!userId) {
            throw new AppError('User not authenticated logic error', 401);
        }
        const stats = await dashboardService.getSellerStats(userId);
        res.json(stats);
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error in getSellerDashboard:', error);
        throw new AppError('Failed to fetch seller dashboard data', 500);
    }
};

export const getBidderDashboard = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?.sub;
        if (!userId) {
            throw new AppError('User not authenticated logic error', 401);
        }
        const stats = await dashboardService.getBidderStats(userId);
        res.json(stats);
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error in getBidderDashboard:', error);
        throw new AppError('Failed to fetch bidder dashboard data', 500);
    }
};

export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        const stats = await dashboardService.getAdminStats();
        res.json(stats);
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error in getAdminDashboard:', error);
        throw new AppError('Failed to fetch admin dashboard data', 500);
    }
};
