import { Router } from "express";
import * as AssetController from "../controllers/asset.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Specific routes first
router.get("/my", authenticate, AssetController.getMyAssets);

// Public generic routes
router.get("/:id", AssetController.getAssetById);

// Protected routes
router.use(authenticate);

router.post("/", AssetController.createAsset);
router.put("/:id", AssetController.updateAsset);
router.post("/:id/submit", AssetController.submitAsset);

export default router;

