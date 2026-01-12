import { Router } from "express";
import * as AuctionController from "../controllers/auction.controller";
import { getAuctionBids } from "../controllers/bid.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public (roughly - though listing might be public, creation is auth)
router.get("/", AuctionController.listAuctions);
router.get("/:id", AuctionController.getAuction);
router.get("/:id/bids", getAuctionBids);

// Protected
router.use(authenticate);
router.post("/", AuctionController.createAuction);
router.post("/:id/cancel", AuctionController.cancelAuction);

export default router;
