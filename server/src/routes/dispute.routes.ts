
import { Router } from "express";
import { raiseDispute, listDisputes, resolveDispute } from "../controllers/dispute.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Route: POST /api/v1/escrows/:id/dispute
// But I need to structure this. 
// Should I mix routes?
// Proposal:
// POST /escrows/:id/dispute
// GET /admin/disputes
// POST /admin/disputes/:id/resolve

router.post("/escrows/:id/dispute", authenticate, raiseDispute);
router.get("/admin/disputes", authenticate, authorize(["ADMIN"]), listDisputes);
router.post("/admin/disputes/:id/resolve", authenticate, authorize(["ADMIN"]), resolveDispute);

export const disputeRoutes = router;
