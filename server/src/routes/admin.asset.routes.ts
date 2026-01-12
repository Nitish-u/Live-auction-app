import { Router } from "express";
import * as AdminAssetController from "../controllers/admin.asset.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/pending", AdminAssetController.getPendingAssets);
router.post("/:id/approve", AdminAssetController.approveAsset);
router.post("/:id/reject", AdminAssetController.rejectAsset);

export default router;
