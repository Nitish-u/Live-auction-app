import { Router } from "express";
import { placeBid } from "../controllers/bid.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Protected: Only authenticated users can bid
router.post("/", authenticate, placeBid);

// Public/Protected? Requirements didn't specify, but "No bidder sensitive info".
// Likely okay to be public or auth. Let's make it auth for now as per "Protected" comment,
// but actually "Get Auction Bids (Read-Only)" might be public.
// Feature 7 "Explore Auctions" is public. Bid history usually public.
// But "base path /api/v1/bids"?
// Spec: "GET /api/v1/auctions/:id/bids".
// So this route file might handle `/` for POST.
// But GET is on auction resource?
// Let's re-read Spec: "Base Path /api/v1/bids" ... "GET /api/v1/auctions/:id/bids"
// Ah, GET is sub-resource of auctions.
// So GET /auctions/:id/bids should be in auction routes or forwarded.
// OR we can make this router handle both if mounted correctly?
// Typically:
// POST /api/v1/bids (Place bid)
// GET /api/v1/auctions/:id/bids (Get bids) -> This suggests it belongs in AuctionController or we mount specific path.

// Let's implement placeBid here.
// And for GET /auctions/:id/bids, we can add to `auction.routes.ts` or here if we have flexibility.
// Spec says: "Base Path /api/v1/bids".
// And "2. Get Auction Bids ... GET /api/v1/auctions/:id/bids"
// Okay, let's put POST in `bid.routes.ts` mounted at `/bids`.
// And GET in `auction.routes.ts` mounted at `/auctions`.

export const bidRoutes = router;
