import { Router } from "express";
import { env } from "../config/env";

const router = Router();

router.get("/health", (_, res) => {
    res.json({
        status: "ok",
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

export default router;
