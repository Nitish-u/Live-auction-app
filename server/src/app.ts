import express from "express";
import cors from "cors";
import crypto from "crypto";
import { errorHandler } from "./middlewares/errorHandler";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import walletRoutes from "./routes/wallet.routes";
import assetRoutes from "./routes/asset.routes";
import assetGalleryRoutes from "./routes/asset.gallery.routes";
import adminAssetRoutes from "./routes/admin.asset.routes";
import auctionRoutes from "./routes/auction.routes";
import { bidRoutes } from "./routes/bid.routes";
import { settlementRoutes } from "./routes/settlement.routes";
import { messageRoutes } from "./routes/message.routes";
import { disputeRoutes } from "./routes/dispute.routes";
import userRoutes from "./routes/user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import notificationRoutes from "./routes/notification.routes";
import uploadRoutes from "./routes/upload.routes";
import proposalRoutes from "./routes/proposal.routes";
import path from "path";
import logger from "./config/logger";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.headers['x-request-id'] = requestId as string; // Ensure downstream uses it if needed

  // Log Request
  logger.info(`Incoming request`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    requestId,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type')
    }
  });

  // Log Response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, `Request completed`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId
    });
  });

  next();
});

// Serve static files from 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Versioning
app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/assets", assetGalleryRoutes); // Public read-only routes
app.use("/api/v1/assets", assetRoutes); // Protected write routes
app.use("/api/v1/admin/assets", adminAssetRoutes);
app.use("/api/v1/auctions", auctionRoutes);
app.use("/api/v1/bids", bidRoutes);
app.use("/api/v1/auctions", settlementRoutes); // Mounted on /auctions for /:id/settle
app.use("/api/v1/auctions", messageRoutes); // Mounted on /auctions for /:id/messages
app.use("/api/v1", disputeRoutes); // Mounted on /api/v1 for /escrows/:id/dispute and /admin/disputes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/proposals", proposalRoutes);
app.use("/api/v1/upload", uploadRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
