import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Seller Dashboard
router.get('/seller', dashboardController.getSellerDashboard);

// Bidder Dashboard
router.get('/bidder', dashboardController.getBidderDashboard);

// Admin Dashboard - Requires ADMIN role
router.get('/admin', requireRole('ADMIN'), dashboardController.getAdminDashboard);

export default router;
