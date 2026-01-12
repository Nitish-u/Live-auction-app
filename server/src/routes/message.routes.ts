
import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/message.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Nested routes likely mounted as /api/v1/auctions
// So paths are relative to /auctions
// Wait, REST standard: 
// POST /api/v1/auctions/:id/messages
// GET /api/v1/auctions/:id/messages
// If I mount this router at /api/v1/auctions, I need to handle :id param here.
// OR I can use `mergeParams: true` if mounted at `:id/messages`.
// Let's assume typical mounting: app.use('/api/v1/auctions', auctionRoutes)
// And inside auctionRoutes -> use nested router?
// EASIER: Just define full path or mount separate router.
// Given strict instructions: "/api/v1/auctions/:id/messages"
// I will create `message.routes.ts` that handles `/:id/messages` and mount it at `/api/v1/auctions`.

router.get("/:id/messages", authenticate, getMessages);
router.post("/:id/messages", authenticate, sendMessage);

export const messageRoutes = router;
