import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import logger from "../config/logger";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(`Error processing request`, {
        error: err.message,
        stack: err.stack,
        code: err.code || 'INTERNAL_ERROR',
        path: req.path,
        method: req.method
    });

    if (err instanceof z.ZodError) {
        return res.status(400).json({
            error: {
                message: "Validation Error",
                details: (err as any).errors || (err as any).issues,
                code: "VALIDATION_ERROR",
            },
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        error: {
            message,
            code: err.code || "INTERNAL_ERROR",
        },
    });
};
