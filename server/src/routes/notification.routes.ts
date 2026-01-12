import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getMyNotifications);
router.post("/:id/read", notificationController.markAsRead);

export default router;
