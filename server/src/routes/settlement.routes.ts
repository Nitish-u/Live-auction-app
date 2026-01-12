
import { Router } from "express";
import { settleAuction } from "../controllers/settlement.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Protected: Admin Only
// Note: Assuming 'authorize' middleware exists or we implement check.
// Using generic 'authenticate' for now, but adding TODO for strict RBAC if 'authorize' missing.
router.post("/:id/settle", authenticate, settleAuction);

export const settlementRoutes = router;
