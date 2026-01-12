import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.schema";

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const input = registerSchema.parse(req.body);
        const result = await authService.register(input);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const input = loginSchema.parse(req.body);
        const result = await authService.login(input);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const me = (req: Request, res: Response) => {
    res.json({ user: req.user });
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            throw { statusCode: 401, message: "Unauthorized", code: "UNAUTHORIZED" };
        }
        const input = changePasswordSchema.parse(req.body);
        const result = await authService.changePassword(userId, input);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const input = forgotPasswordSchema.parse(req.body);
        const result = await authService.forgotPassword(input);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const input = resetPasswordSchema.parse(req.body);
        const result = await authService.resetPassword(input);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
