import { Router } from "express";
import * as WalletController from "../controllers/wallet.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", WalletController.getWallet);
router.post("/add-funds", WalletController.addFunds);

export default router;
