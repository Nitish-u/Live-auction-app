import { Request, Response, NextFunction } from "express";
import { token } from "../utils/jwt";

// Extend Express Request type
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: {
                id: string;
                sub: string;
                email: string;
                role: string;
                [key: string]: unknown;
            };
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("[AUTH] Missing or invalid Authorization header:", authHeader);
        return res.status(401).json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    }

    const jwtToken = authHeader.split(" ")[1];

    if (!jwtToken) {
        console.log("[AUTH] Missing token part in header");
        return res.status(401).json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    }


    try {
        const payload = token.verify(jwtToken) as { sub: string; email: string; role: string;[key: string]: unknown };
        // Normalize user ID to be available as 'id' as well, since some controllers expect it
        req.user = { ...payload, id: payload.sub };
        next();
    } catch (err) {
        console.error("[AUTH] Token verification failed:", err);
        return res.status(401).json({ error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } });
    }
};
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!roles.includes(req.user.role)) { // Assuming verifyToken decodes role
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        next();
    };
};
